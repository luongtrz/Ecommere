import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { MoneyUtil } from '@/common/utils/money.util';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    images: true,
                  },
                },
              },
            },
          },
        },
        coupon: true,
      },
    });

    return this.calculateCartTotals(cart);
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { variantId, quantity } = addToCartDto;

    await this.runSerializableTransaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }

      if (!variant.product.active) {
        throw new BadRequestException('Product is not available');
      }

      const cart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          variantId,
        },
      });
      const newQuantity = (existingItem?.quantity ?? 0) + quantity;

      if (variant.stock < newQuantity) {
        throw new BadRequestException(`Only ${variant.stock} units available in stock`);
      }

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            variantId,
            quantity,
            priceSnapshot: variant.salePrice ?? variant.price,
          },
        });
      }
    });

    return this.getCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, updateCartItemDto: UpdateCartItemDto) {
    const { quantity } = updateCartItemDto;

    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        variant: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.cart.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (cartItem.variant.stock < quantity) {
      throw new BadRequestException(`Only ${cartItem.variant.stock} units available in stock`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeCartItem(userId: string, itemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.cart.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { couponId: null },
      });
    }

    return this.getCart(userId);
  }

  async applyCoupon(userId: string, couponCode?: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Remove coupon if couponCode is null or empty
    if (!couponCode) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { couponId: null },
      });
      return this.getCart(userId);
    }

    // Validate coupon exists
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const now = new Date();
    if (!coupon.active) {
      throw new BadRequestException('Coupon is inactive');
    }

    if (coupon.validFrom && coupon.validFrom > now) {
      throw new BadRequestException('Coupon is not yet valid');
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      throw new BadRequestException('Coupon has expired');
    }

    const currentCart = await this.getCart(userId);

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon has reached maximum usage limit');
    }

    if (coupon.maxUsesPerUser) {
      const userUsageCount = await this.prisma.order.count({
        where: {
          userId,
          couponCode: coupon.code,
          status: { not: OrderStatus.CANCELED },
        },
      });

      if (userUsageCount >= coupon.maxUsesPerUser) {
        throw new BadRequestException('You have already used this coupon the maximum number of times');
      }
    }

    if (coupon.minOrder != null && currentCart.subtotal < coupon.minOrder) {
      throw new BadRequestException(`Minimum order amount is ${MoneyUtil.format(coupon.minOrder)}`);
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.code },
    });

    return this.getCart(userId);
  }

  private calculateCartTotals(cart: any) {
    let subtotal = 0;

    const items = cart.items.map((item: any) => {
      const price = item.variant.salePrice ?? item.variant.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      return {
        ...item,
        price,
        itemTotal,
      };
    });

    let discount = 0;

    const now = new Date();
    if (
      cart.coupon &&
      cart.coupon.active &&
      (!cart.coupon.validFrom || cart.coupon.validFrom <= now) &&
      (!cart.coupon.validUntil || cart.coupon.validUntil >= now)
    ) {
      discount = MoneyUtil.calculateDiscount(
        subtotal,
        cart.coupon.type,
        cart.coupon.value,
        cart.coupon.maxDiscount,
      );
    }

    const total = subtotal - discount;

    return {
      ...cart,
      items,
      subtotal,
      discount,
      total,
    };
  }

  // Internal method used by orders service
  async validateCartForCheckout(userId: string) {
    const cart = await this.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Check stock availability for all items
    for (const item of cart.items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        throw new BadRequestException(`Product variant not found: ${item.variant.sku}`);
      }

      if (!variant.product.active) {
        throw new BadRequestException(`Product is no longer available: ${variant.product.name}`);
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${variant.product.name} - ${variant.scent}. Only ${variant.stock} available.`,
        );
      }
    }

    return cart;
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
          (error.code === 'P2002' || error.code === 'P2034') &&
          attempt < 2
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException('Cart update could not be completed; please retry');
  }
}
