import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, StockMovementType } from '@prisma/client';
import { StockAdjustmentDto } from './dtos/stock-adjustment.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async adjustStock(adjustmentDto: StockAdjustmentDto, userId: string) {
    const { variantId, type, quantity, notes } = adjustmentDto;

    if (type !== StockMovementType.ADJUST && quantity < 1) {
      throw new BadRequestException('Quantity must be greater than zero for stock in/out');
    }

    return this.runSerializableTransaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }

      let updatedVariant;
      let previousStock: number;
      let newStock: number;

      switch (type) {
        case StockMovementType.IN:
          updatedVariant = await tx.productVariant.update({
            where: { id: variantId },
            data: { stock: { increment: quantity } },
          });
          newStock = updatedVariant.stock;
          previousStock = newStock - quantity;
          break;
        case StockMovementType.OUT: {
          const stockUpdate = await tx.productVariant.updateMany({
            where: {
              id: variantId,
              stock: { gte: quantity },
            },
            data: { stock: { decrement: quantity } },
          });

          if (stockUpdate.count !== 1) {
            throw new BadRequestException('Insufficient stock for this operation');
          }

          updatedVariant = await tx.productVariant.findUnique({
            where: { id: variantId },
          });

          if (!updatedVariant) {
            throw new NotFoundException('Product variant not found');
          }

          newStock = updatedVariant.stock;
          previousStock = newStock + quantity;
          break;
        }
        case StockMovementType.ADJUST:
          // For ADJUST, quantity represents the target stock level.
          updatedVariant = await tx.productVariant.update({
            where: { id: variantId },
            data: { stock: quantity },
          });
          previousStock = variant.stock;
          newStock = updatedVariant.stock;
          break;
      }

      const movement = await tx.stockMovement.create({
        data: {
          variantId,
          type,
          quantity: type === StockMovementType.ADJUST ? Math.abs(newStock - previousStock) : quantity,
          previousStock,
          newStock,
          notes,
        },
      });

      return {
        ...movement,
        variant: updatedVariant,
      };
    });
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
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }

      const stockUpdate = await tx.productVariant.updateMany({
        where: {
          id: variantId,
          stock: { gte: quantity },
        },
        data: { stock: { decrement: quantity } },
      });

      if (stockUpdate.count !== 1) {
        throw new BadRequestException(`Insufficient stock for variant ${variant.sku}`);
      }

      const updatedVariant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!updatedVariant) {
        throw new NotFoundException('Product variant not found');
      }

      const newStock = updatedVariant.stock;
      await tx.stockMovement.create({
        data: {
          variantId,
          type: StockMovementType.OUT,
          quantity,
          previousStock: newStock + quantity,
          newStock,
          notes: `Reserved for order ${orderId}`,
        },
      });

      return updatedVariant;
    });
  }

  // Internal method used by orders service (for cancellations/refunds)
  async restoreStock(variantId: string, quantity: number, orderId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }

      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: quantity } },
      });

      const newStock = updatedVariant.stock;
      await tx.stockMovement.create({
        data: {
          variantId,
          type: StockMovementType.IN,
          quantity,
          previousStock: newStock - quantity,
          newStock,
          notes: `${reason} - Order ${orderId}`,
        },
      });

      return updatedVariant;
    });
  }

  private async runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 2
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException('Stock adjustment could not be completed; please retry');
  }
}
