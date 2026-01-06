import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SlugifyUtil } from '@/common/utils/slugify.util';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map(cat => ({
      ...cat,
      productCount: cat._count.products,
    }));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...category,
      productCount: category._count.products,
    };
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...category,
      productCount: category._count.products,
    };
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, parentId } = createCategoryDto;
    const slug = SlugifyUtil.generate(name);

    // Check if slug exists
    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        name,
        slug,
        parentId,
      },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const data: any = { ...updateCategoryDto };

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      data.slug = SlugifyUtil.generate(updateCategoryDto.name);
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Use canDelete validation
    const validation = await this.canDelete(id);
    if (!validation.canDelete) {
      throw new BadRequestException(validation.reason);
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }

  /**
   * Get hierarchical tree structure of all categories
   */
  async getTreeStructure() {
    // Get all categories
    const allCategories = await this.prisma.category.findMany({
      include: {
        children: {
          include: {
            children: true, // For deeper nesting if needed
            _count: {
              select: { products: true },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filter to get only root categories (parentId is null)
    const rootCategories = allCategories.filter(cat => !cat.parentId);

    // Build tree recursively
    const buildTree = (categories: any[]): any[] => {
      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        productCount: cat._count?.products ?? 0,
        children: cat.children ? buildTree(cat.children) : [],
        isLeaf: !cat.children || cat.children.length === 0,
      }));
    };

    return buildTree(rootCategories);
  }

  /**
   * Check if category is a leaf (has no children)
   */
  async isLeafCategory(id: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return !category.children || category.children.length === 0;
  }

  /**
   * Validate if category can be deleted
   * Rules: No children AND no products
   */
  async canDelete(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for children
    if (category.children && category.children.length > 0) {
      return {
        canDelete: false,
        reason: `Cannot delete category with ${category.children.length} subcategories. Please delete or move subcategories first.`,
      };
    }

    // Check for products
    if (category._count.products > 0) {
      return {
        canDelete: false,
        reason: `Cannot delete category with ${category._count.products} products. Please reassign products first.`,
      };
    }

    return { canDelete: true };
  }

  /**
   * Validate that products can only be assigned to leaf categories
   */
  async validateProductAssignment(categoryId: string): Promise<void> {
    const isLeaf = await this.isLeafCategory(categoryId);

    if (!isLeaf) {
      throw new BadRequestException(
        'Products can only be assigned to leaf categories (categories without subcategories)',
      );
    }
  }
  /**
   * Get all descendant category IDs (recursive)
   * Used for filtering products by parent category
   */
  async getDescendantIds(categoryId: string): Promise<string[]> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: true },
    });

    if (!category) return [];

    let ids = [category.id];

    for (const child of category.children) {
      const childIds = await this.getDescendantIds(child.id);
      ids = [...ids, ...childIds];
    }

    return ids;
  }
}
