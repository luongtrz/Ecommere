import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MoneyUtil } from '@/common/utils/money.util';
import { OrderStatus, PaymentStatus, StockMovementType } from '@prisma/client';
import { CheckoutDto } from './dtos/checkout.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { OrderFilterDto } from './dtos/order-filter.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string, checkoutDto: CheckoutDto) {
    const {
      addressId,
      fullName,
      phone,
      province,
      district,
      ward,
      line1,
      items,
      paymentMethod,
      shippingAddress,
      shippingMethod,
      total,
    } = checkoutDto;

    // Get user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    // Determine items to use for checkout
    let itemsToUse: any[] = [];
    let couponCode: string | null = null;
    let cartId: string | null = null;

    if (cart && cart.items.length > 0) {
      // Use cart items
      itemsToUse = cart.items;
      cartId = cart.id;

      // Load coupon if cart has one
      if (cart.couponId) {
        const coupon = await this.prisma.coupon.findUnique({
          where: { code: cart.couponId },
        });
        if (coupon) {
          couponCode = coupon.code;
        }
      }
    } else if (items && items.length > 0) {
      // Use items from DTO
      for (const item of items) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) {
          throw new NotFoundException(`Product variant not found: ${item.variantId}`);
        }

        if (!variant.product.active) {
          throw new BadRequestException(`Product is no longer available: ${variant.product.name}`);
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${variant.product.name} - ${variant.scent}. Only ${variant.stock} available.`,
          );
        }

        itemsToUse.push({
          variant,
          quantity: item.quantity,
          variantId: item.variantId,
          priceSnapshot: item.price,
        });
      }
    } else {
      throw new BadRequestException('Cart is empty or no items provided');
    }

    // Handle address - either use existing or create new
    let address;
    if (addressId) {
      // Use existing address
      address = await this.prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address || address.userId !== userId) {
        throw new NotFoundException('Address not found');
      }
    } else if (fullName && phone && province && district && ward && line1) {
      // Create new address
      address = await this.prisma.address.create({
        data: {
          userId,
          fullName,
          phone,
          province,
          district,
          ward,
          line1,
          isDefault: false, // Don't set as default during checkout
        },
      });
    } else {
      throw new BadRequestException('Either addressId or complete address information must be provided');
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = itemsToUse.map((item) => {
      const price = item.variant.salePrice || item.variant.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      return {
        variantId: item.variantId,
        productId: item.variant.productId,
        quantity: item.quantity,
        nameSnapshot: item.variant.product.name,
        scentSnapshot: item.variant.scent,
        volumeSnapshot: item.variant.volumeMl,
        unitPrice: price,
        lineTotal: itemTotal,
      };
    });

    // Apply coupon discount if coupon loaded
    let discount = 0;
    let coupon = null;

    if (couponCode) {
      coupon = await this.prisma.coupon.findUnique({
        where: { code: couponCode },
      });
    }

    if (coupon) {
      // Validate coupon (date, usage limits)
      const now = new Date();
      if (coupon.validFrom && coupon.validFrom > now) {
        throw new BadRequestException('Coupon is not yet valid');
      }
      if (coupon.validUntil && coupon.validUntil < now) {
        throw new BadRequestException('Coupon has expired');
      }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new BadRequestException('Coupon has reached maximum usage limit');
      }

      // Check per-user usage limit
      if (coupon.maxUsesPerUser) {
        const userUsageCount = await this.prisma.order.count({
          where: {
            userId,
            couponCode: coupon.code,
          },
        });

        if (userUsageCount >= coupon.maxUsesPerUser) {
          throw new BadRequestException('You have already used this coupon the maximum number of times');
        }
      }

      // Check minimum order
      if (coupon.minOrder && subtotal < coupon.minOrder) {
        throw new BadRequestException(`Minimum order amount is ${MoneyUtil.format(coupon.minOrder)}`);
      }

      discount = MoneyUtil.calculateDiscount(
        subtotal,
        coupon.type,
        coupon.value,
        coupon.maxDiscount,
      );
    }

    // Calculate shipping fee
    const shippingFee = checkoutDto.shippingFee || this.calculateShippingFee(address);

    const orderTotal = subtotal - discount + shippingFee;

    // Generate unique order number
    const code = await this.generateOrderNumber();

    // Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          code,
          user: {
            connect: { id: userId },
          },
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          discount,
          shippingFee,
          total: orderTotal,
          couponCode,
          paymentMethod: paymentMethod || 'PENDING',
          addressJson: JSON.stringify({
            fullName: address.fullName,
            phone: address.phone,
            province: address.province,
            district: address.district,
            ward: address.ward,
            line1: address.line1,
          }),
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // Reserve stock for each item
      for (const item of itemsToUse) {
        const previousStock = item.variant.stock;
        const newStock = previousStock - item.quantity;

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            type: StockMovementType.OUT,
            quantity: item.quantity,
            previousStock,
            newStock,
            notes: `Reserved for order ${code}`,
          },
        });
      }

      // Increment coupon usage count
      if (couponCode && coupon) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear cart if it was used
      if (cartId) {
        await tx.cartItem.deleteMany({
          where: { cartId },
        });

        await tx.cart.update({
          where: { id: cartId },
          data: { couponId: null },
        });
      }

      return newOrder;
    });

    return order;
  }

  async getMyOrders(userId: string, filterDto: OrderFilterDto) {
    const { page = 1, limit = 10, status } = filterDto;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  async getMyOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
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
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return order;
  }

  async getAllOrders(filterDto: OrderFilterDto) {
    const { page = 1, limit = 20, status, search } = filterDto;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const { status } = updateOrderStatusDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transitions
    this.validateStatusTransition(order.status, status);

    // Handle stock restoration for cancelled/refunded orders
    if (
      (status === OrderStatus.CANCELED || status === OrderStatus.REFUNDED) &&
      order.status !== OrderStatus.CANCELED &&
      order.status !== OrderStatus.REFUNDED
    ) {
      await this.restoreStockForOrder(order);
    }

    // Update payment status based on order status
    let paymentStatus = order.paymentStatus;
    if (status === OrderStatus.PAID || status === OrderStatus.PACKING || status === OrderStatus.SHIPPED) {
      paymentStatus = PaymentStatus.COMPLETED;
    } else if (status === OrderStatus.REFUNDED) {
      paymentStatus = PaymentStatus.REFUNDED;
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        paymentStatus,
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // Only allow cancellation for pending or paid orders (before packing)
    if (
      order.status !== OrderStatus.PENDING_PAYMENT &&
      order.status !== OrderStatus.PAID
    ) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    // Restore stock
    await this.restoreStockForOrder(order);

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.FAILED,
      },
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Get count of orders today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const todayOrderCount = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = (todayOrderCount + 1).toString().padStart(4, '0');
    
    // Add random suffix to prevent race condition
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    return `ORD${year}${month}${day}${sequence}${random}`;
  }

  private calculateShippingFee(address: any): number {
    // Mock shipping calculation - flat rate based on province
    // In real implementation, this would integrate with shipping provider API
    const provinceLowerCase = address.province.toLowerCase();

    // Free shipping for Bangkok and surrounding areas
    if (
      provinceLowerCase.includes('bangkok') ||
      provinceLowerCase.includes('กรุงเทพ') ||
      provinceLowerCase.includes('nonthaburi') ||
      provinceLowerCase.includes('นนทบุรี')
    ) {
      return 0;
    }

    // Standard shipping for other provinces
    return 50000; // 50 THB
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELED],
      [OrderStatus.PAID]: [OrderStatus.PACKING, OrderStatus.CANCELED],
      [OrderStatus.PACKING]: [OrderStatus.SHIPPED, OrderStatus.CANCELED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private async restoreStockForOrder(order: any) {
    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (variant) {
          const previousStock = variant.stock;
          const newStock = previousStock + item.quantity;

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: newStock },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              type: StockMovementType.IN,
              quantity: item.quantity,
              previousStock,
              newStock,
              notes: `Stock restored from ${order.status} order ${order.code}`,
            },
          });
        }
      }
    });
  }
}
