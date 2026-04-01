import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SlugifyUtil } from '@/common/utils/slugify.util';
import { CategoriesService } from '@/categories/categories.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { CreateVariantDto } from './dtos/create-variant.dto';
import { UpdateVariantDto } from './dtos/update-variant.dto';
import { ProductFilterDto, ProductSortBy } from './dtos/product-filter.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private categoriesService: CategoriesService,
  ) { }

  async findAll(filterDto: ProductFilterDto) {
    const { page = 1, limit = 12, search, categoryId, categorySlug, sortBy = ProductSortBy.NEWEST, minPrice, maxPrice, brand, scent, volumeMl } = filterDto;

    const where: any = { active: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Handle category filtering
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      // Find category by slug and use its id
      const category = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        where.categoryId = category.id;
      } else {
        // If category not found, return empty results
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
    }

    // Brand filter (comma-separated)
    if (brand) {
      const brands = brand.split(',').map(b => b.trim()).filter(Boolean);
      if (brands.length > 0) {
        where.brand = { in: brands };
      }
    }

    // Variant-level filters: price range, scent, volumeMl
    const variantConditions: any[] = [];

    if (minPrice !== undefined) {
      variantConditions.push({ price: { gte: minPrice } });
    }
    if (maxPrice !== undefined) {
      variantConditions.push({ price: { lte: maxPrice } });
    }
    if (scent) {
      const scents = scent.split(',').map(s => s.trim()).filter(Boolean);
      if (scents.length > 0) {
        variantConditions.push({ scent: { in: scents } });
      }
    }
    if (volumeMl) {
      const volumes = volumeMl.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
      if (volumes.length > 0) {
        variantConditions.push({ volumeMl: { in: volumes } });
      }
    }

    if (variantConditions.length > 0) {
      where.variants = {
        some: {
          AND: variantConditions,
        },
      };
    }

    let orderBy: any = {};
    switch (sortBy) {
      case ProductSortBy.NEWEST:
        orderBy = { createdAt: 'desc' };
        break;
      case ProductSortBy.OLDEST:
        orderBy = { createdAt: 'asc' };
        break;
      case ProductSortBy.PRICE_ASC:
        orderBy = { basePrice: 'asc' };
        break;
      case ProductSortBy.PRICE_DESC:
        orderBy = { basePrice: 'desc' };
        break;
      case ProductSortBy.NAME_ASC:
        orderBy = { name: 'asc' };
        break;
      case ProductSortBy.NAME_DESC:
        orderBy = { name: 'desc' };
        break;
      case ProductSortBy.BEST_SELLING:
        // Sort by total quantity sold (sum of orderItems quantity)
        orderBy = { createdAt: 'desc' }; // Default to newest for now
        break;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          variants: true,
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Batch-fetch average ratings for all products in one query
    const productIds = products.map(p => p.id);
    const ratingAggregates = productIds.length > 0
      ? await this.prisma.review.groupBy({
          by: ['productId'],
          where: { productId: { in: productIds } },
          _avg: { rating: true },
        })
      : [];
    const ratingMap = new Map(
      ratingAggregates.map(r => [r.productId, r._avg.rating || 0]),
    );

    const productsWithStats = products.map(product => ({
      ...product,
      averageRating: parseFloat((ratingMap.get(product.id) || 0).toFixed(2)),
      reviewCount: product._count.reviews,
    }));

    return {
      data: productsWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string) {
    const [product, reviewAggregate] = await Promise.all([
      this.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          variants: true,
          reviews: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20, // Paginate reviews - load first 20
          },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.review.aggregate({
        where: { productId: id },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...product,
      averageRating: parseFloat((reviewAggregate._avg.rating || 0).toFixed(2)),
      reviewCount: reviewAggregate._count.rating,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true,
        reviews: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // Paginate reviews - load first 20
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviewAggregate = await this.prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      ...product,
      averageRating: parseFloat((reviewAggregate._avg.rating || 0).toFixed(2)),
      reviewCount: reviewAggregate._count.rating,
    };
  }

  async create(createProductDto: CreateProductDto) {
    const { name, description, brand, images, categoryId, basePrice, active = true, variants } = createProductDto;
    const slug = SlugifyUtil.generate(name);

    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Validate that category is a leaf (no children)
    await this.categoriesService.validateProductAssignment(categoryId);

    // Check if slug exists
    const existing = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Product with this name already exists');
    }

    // Create product with variants
    const product = await this.prisma.product.create({
      data: {
        name,
        slug,
        description,
        brand,
        images,
        categoryId,
        basePrice,
        active,
        variants: {
          create: variants.map((variant, index) => ({
            sku: `${slug.toUpperCase()}-${variant.scent.substring(0, 3).toUpperCase()}-${variant.volumeMl}ML`,
            scent: variant.scent,
            volumeMl: variant.volumeMl,
            price: variant.price,
            salePrice: variant.salePrice,
            stock: variant.stock,
            barcode: variant.barcode,
          })),
        },
      },
      include: {
        variants: true,
        category: true,
      },
    });

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const data: any = { ...updateProductDto };

    if (updateProductDto.name && updateProductDto.name !== product.name) {
      data.slug = SlugifyUtil.generate(updateProductDto.name);
    }

    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }

      // Validate that category is a leaf (no children)
      await this.categoriesService.validateProductAssignment(updateProductDto.categoryId);
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
        category: true,
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            cartItems: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if any variant has cart items or order items
    const hasCartOrders = product.variants?.some(
      v => v.cartItems.length > 0 || v.orderItems.length > 0
    ) || false;

    if (hasCartOrders) {
      throw new BadRequestException('Cannot delete product with existing cart items or orders');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Get dynamic filter options from existing products data
   */
  async getFilterOptions() {
    const [brands, scents, volumes, priceRange] = await Promise.all([
      // Get distinct brands
      this.prisma.product.findMany({
        where: { active: true, brand: { not: null } },
        select: { brand: true },
        distinct: ['brand'],
        orderBy: { brand: 'asc' },
      }),
      // Get distinct scents
      this.prisma.productVariant.findMany({
        where: { product: { active: true } },
        select: { scent: true },
        distinct: ['scent'],
        orderBy: { scent: 'asc' },
      }),
      // Get distinct volumes
      this.prisma.productVariant.findMany({
        where: { product: { active: true } },
        select: { volumeMl: true },
        distinct: ['volumeMl'],
        orderBy: { volumeMl: 'asc' },
      }),
      // Get price range
      this.prisma.productVariant.aggregate({
        where: { product: { active: true } },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return {
      brands: brands.map(b => b.brand).filter(Boolean),
      scents: scents.map(s => s.scent),
      volumes: volumes.map(v => v.volumeMl),
      priceRange: {
        min: priceRange._min.price || 0,
        max: priceRange._max.price || 0,
      },
    };
  }

  // Variant Management
  async createVariant(productId: string, createVariantDto: CreateVariantDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const sku = `${product.slug.toUpperCase()}-${createVariantDto.scent.substring(0, 3).toUpperCase()}-${createVariantDto.volumeMl}ML`;

    return this.prisma.productVariant.create({
      data: {
        productId,
        sku,
        scent: createVariantDto.scent,
        volumeMl: createVariantDto.volumeMl,
        price: createVariantDto.price,
        salePrice: createVariantDto.salePrice,
        stock: createVariantDto.stock,
        barcode: createVariantDto.barcode,
      },
    });
  }

  async updateVariant(variantId: string, updateVariantDto: UpdateVariantDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const data: any = { ...updateVariantDto };

    if (updateVariantDto.scent || updateVariantDto.volumeMl) {
      const scent = updateVariantDto.scent || variant.scent;
      const volumeMl = updateVariantDto.volumeMl || variant.volumeMl;
      data.sku = `${variant.product.slug.toUpperCase()}-${scent.substring(0, 3).toUpperCase()}-${volumeMl}ML`;
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  }

  async removeVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: {
            _count: {
              select: { variants: true },
            },
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    if (variant.product._count.variants <= 1) {
      throw new BadRequestException('Cannot delete the last variant of a product');
    }

    await this.prisma.productVariant.delete({
      where: { id: variantId },
    });

    return { message: 'Variant deleted successfully' };
  }
}
