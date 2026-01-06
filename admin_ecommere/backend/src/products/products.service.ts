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
    const { page = 1, limit = 12, search, categoryId, categorySlug, sortBy = ProductSortBy.NEWEST, minPrice, maxPrice } = filterDto;

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
      const categoryIds = await this.categoriesService.getDescendantIds(categoryId);
      if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds };
      } else {
        where.categoryId = categoryId;
      }
    } else if (categorySlug) {
      // Find category by slug and use its id
      const category = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        const categoryIds = await this.categoriesService.getDescendantIds(category.id);
        if (categoryIds.length > 0) {
          where.categoryId = { in: categoryIds };
        } else {
          where.categoryId = category.id;
        }
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

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          AND: [
            minPrice !== undefined ? { price: { gte: minPrice } } : {},
            maxPrice !== undefined ? { price: { lte: maxPrice } } : {},
          ],
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
          reviews: {
            select: { rating: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const productsWithStats = products.map(product => {
      const ratings = product.reviews.map(r => r.rating);
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return {
        ...product,
        averageRating: parseFloat(averageRating.toFixed(2)),
        reviewCount: ratings.length,
      };
    });

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
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const ratings = product.reviews.map(r => r.rating);
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return {
      ...product,
      averageRating: parseFloat(averageRating.toFixed(2)),
      reviewCount: ratings.length,
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const ratings = product.reviews.map(r => r.rating);
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return {
      ...product,
      averageRating: parseFloat(averageRating.toFixed(2)),
      reviewCount: ratings.length,
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
