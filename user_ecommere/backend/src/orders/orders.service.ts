import { randomBytes } from 'crypto';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MoneyUtil } from '@/common/utils/money.util';
import { Prisma, CouponType, OrderStatus, PaymentStatus, StockMovementType } from '@prisma/client';
import { CheckoutDto, ShippingMethod } from './dtos/checkout.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { OrderFilterDto } from './dtos/order-filter.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

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

    if (items && items.length > 0) {
      // Explicit checkout items are authoritative for clients using a local cart.
      for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          throw new BadRequestException('Quantity must be a positive integer');
        }

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
    } else if (cart && cart.items.length > 0) {
      // Fall back to the server-side cart for API clients that do not send items.
      itemsToUse = cart.items;
      cartId = cart.id;

      if (cart.couponId) {
        const coupon = await this.prisma.coupon.findUnique({
          where: { code: cart.couponId },
        });
        if (coupon) {
          couponCode = coupon.code;
        }
      }
    } else {
      throw new BadRequestException('Cart is empty or no items provided');
    }

    // Cart quantities and product availability can change after the cart was
    // created, so validate them again immediately before pricing the order.
    for (const item of itemsToUse) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new BadRequestException('Quantity must be a positive integer');
      }

      if (!item.variant?.product?.active) {
        throw new BadRequestException(
          `Product is no longer available: ${item.variant?.product?.name ?? 'Unknown product'}`,
        );
      }

      if (item.variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.variant.product.name} - ${item.variant.scent}. Only ${item.variant.stock} available.`,
        );
      }
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
      const price = item.variant.salePrice ?? item.variant.price;
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
      if (!coupon.active) {
        throw new BadRequestException('Coupon is inactive');
      }

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

      discount = coupon.type === CouponType.FREESHIP
        ? 0
        : MoneyUtil.calculateDiscount(
            subtotal,
            coupon.type,
            coupon.value,
            coupon.maxDiscount,
          );
    }

    // Shipping is calculated on the server. Client-provided totals and fees
    // are display values only and must not affect the amount charged.
    const calculatedShippingFee = this.calculateShippingFee(
      address,
      shippingMethod ?? ShippingMethod.STANDARD,
    );
    const shippingFee = coupon?.type === CouponType.FREESHIP ? 0 : calculatedShippingFee;
    if (coupon?.type === CouponType.FREESHIP) {
      discount = calculatedShippingFee;
    }

    const orderTotal = subtotal - discount + shippingFee;

    // Generate unique order number
    const code = await this.generateOrderNumber();

    // Create order in transaction
    const order = await this.runSerializableTransaction(async (tx) => {
      if (couponCode && coupon && coupon.maxUsesPerUser) {
        const userUsageCount = await tx.order.count({
          where: {
            userId,
            couponCode,
          },
        });

        if (userUsageCount >= coupon.maxUsesPerUser) {
          throw new BadRequestException('You have already used this coupon the maximum number of times');
        }
      }

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
        const stockUpdate = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (stockUpdate.count !== 1) {
          throw new BadRequestException(
            `Insufficient stock for ${item.variant.product.name} - ${item.variant.scent}.`,
          );
        }

        const updatedVariant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });

        if (!updatedVariant) {
          throw new NotFoundException(`Product variant not found: ${item.variantId}`);
        }

        const newStock = updatedVariant.stock;
        const previousStock = newStock + item.quantity;

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
        const couponUsage = await tx.coupon.updateMany({
          where: coupon.maxUses
            ? {
                code: couponCode,
                active: true,
                usedCount: { lt: coupon.maxUses },
              }
            : { code: couponCode, active: true },
          data: { usedCount: { increment: 1 } },
        });

        if (couponUsage.count !== 1) {
          throw new BadRequestException('Coupon is no longer available');
        }
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
        { id: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
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

    // Update payment status based on order status
    let paymentStatus = order.paymentStatus;
    if (status === OrderStatus.PAID || status === OrderStatus.PACKING || status === OrderStatus.SHIPPED) {
      paymentStatus = PaymentStatus.COMPLETED;
    } else if (status === OrderStatus.REFUNDED) {
      paymentStatus = PaymentStatus.REFUNDED;
    }

    return this.prisma.$transaction(async (tx) => {
      const statusUpdate = await tx.order.updateMany({
        where: {
          id: orderId,
          status: order.status,
        },
        data: {
          status,
          paymentStatus,
        },
      });

      if (statusUpdate.count !== 1) {
        throw new BadRequestException('Order status changed; please retry');
      }

      if (status === OrderStatus.CANCELED || status === OrderStatus.REFUNDED) {
        await this.restoreStockForOrder(order, tx);
      }

      return tx.order.findUnique({
        where: { id: orderId },
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

    return this.prisma.$transaction(async (tx) => {
      const statusUpdate = await tx.order.updateMany({
        where: {
          id: orderId,
          userId,
          status: {
            in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID],
          },
        },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      if (statusUpdate.count !== 1) {
        throw new BadRequestException('Order cannot be cancelled at this stage');
      }

      await this.restoreStockForOrder(order, tx);

      return tx.order.findUnique({
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

    // The daily count is only a display sequence; use a collision-resistant
    // suffix because concurrent checkouts can observe the same count.
    const random = randomBytes(4).toString('hex').toUpperCase();

    return `ORD${year}${month}${day}${sequence}${random}`;
  }

  private calculateShippingFee(address: any, shippingMethod: ShippingMethod): number {
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

    // Match the shipping options exposed by both frontends.
    return shippingMethod === ShippingMethod.EXPRESS ? 50000 : 30000;
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

  private async restoreStockForOrder(order: any, transactionClient?: any) {
    const restore = async (tx: any) => {
      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (variant) {
          const updatedVariant = await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });

          const newStock = updatedVariant.stock;
          const previousStock = newStock - item.quantity;

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
    };

    if (transactionClient) {
      return restore(transactionClient);
    }

    return this.prisma.$transaction(restore);
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

    throw new BadRequestException('Checkout could not be completed; please retry');
  }
}
