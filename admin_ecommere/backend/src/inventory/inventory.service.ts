import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { StockMovementType } from '@prisma/client';
import { StockAdjustmentDto } from './dtos/stock-adjustment.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async adjustStock(adjustmentDto: StockAdjustmentDto, userId: string) {
    const { variantId, type, quantity, notes } = adjustmentDto;

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const previousStock = variant.stock;
    let newStock = previousStock;

    switch (type) {
      case StockMovementType.IN:
        newStock = previousStock + quantity;
        break;
      case StockMovementType.OUT:
        if (previousStock < quantity) {
          throw new BadRequestException('Insufficient stock for this operation');
        }
        newStock = previousStock - quantity;
        break;
      case StockMovementType.ADJUST:
        // For ADJUST, quantity represents the target stock level
        newStock = quantity;
        break;
    }

    // Update variant stock and create movement record in a transaction
    const [updatedVariant, movement] = await this.prisma.$transaction([
      this.prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      }),
      this.prisma.stockMovement.create({
        data: {
          variantId,
          type,
          quantity: type === StockMovementType.ADJUST ? Math.abs(newStock - previousStock) : quantity,
          previousStock,
          newStock,
          notes,
        },
      }),
    ]);

    return {
      ...movement,
      variant: updatedVariant,
    };
  }

  async getStockHistory(variantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { variantId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where: { variantId } }),
    ]);

    return {
      data: movements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
      variant: {
        id: variant.id,
        sku: variant.sku,
        scent: variant.scent,
        volumeMl: variant.volumeMl,
        currentStock: variant.stock,
        product: {
          id: variant.product.id,
          name: variant.product.name,
          slug: variant.product.slug,
        },
      },
    };
  }

  async getLowStockVariants(threshold: number = 10) {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        stock: { lte: threshold },
        product: { active: true },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            active: true,
          },
        },
      },
      orderBy: { stock: 'asc' },
    });

    return variants.map(variant => ({
      id: variant.id,
      sku: variant.sku,
      scent: variant.scent,
      volumeMl: variant.volumeMl,
      stock: variant.stock,
      price: variant.price,
      salePrice: variant.salePrice,
      product: variant.product,
    }));
  }

  async getAllStockLevels(paginationDto: PaginationDto) {
    const { page = 1, limit = 50 } = paginationDto;

    const [variants, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
              categoryId: true,
            },
          },
        },
        orderBy: [{ product: { name: 'asc' } }, { scent: 'asc' }],
      }),
      this.prisma.productVariant.count(),
    ]);

    return {
      data: variants.map(variant => ({
        id: variant.id,
        sku: variant.sku,
        scent: variant.scent,
        volumeMl: variant.volumeMl,
        stock: variant.stock,
        price: variant.price,
        salePrice: variant.salePrice,
        product: variant.product,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  // Internal method used by orders service
  async reserveStock(variantId: string, quantity: number, orderId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (variant.stock < quantity) {
      throw new BadRequestException(`Insufficient stock for variant ${variant.sku}`);
    }

    const previousStock = variant.stock;
    const newStock = previousStock - quantity;

    const [updatedVariant, movement] = await this.prisma.$transaction([
      this.prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      }),
      this.prisma.stockMovement.create({
        data: {
          variantId,
          type: StockMovementType.OUT,
          quantity,
          previousStock,
          newStock,
          notes: `Reserved for order ${orderId}`,
        },
      }),
    ]);

    return updatedVariant;
  }

  // Internal method used by orders service (for cancellations/refunds)
  async restoreStock(variantId: string, quantity: number, orderId: string, reason: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const previousStock = variant.stock;
    const newStock = previousStock + quantity;

    const [updatedVariant, movement] = await this.prisma.$transaction([
      this.prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      }),
      this.prisma.stockMovement.create({
        data: {
          variantId,
          type: StockMovementType.IN,
          quantity,
          previousStock,
          newStock,
          notes: `${reason} - Order ${orderId}`,
        },
      }),
    ]);

    return updatedVariant;
  }
}
