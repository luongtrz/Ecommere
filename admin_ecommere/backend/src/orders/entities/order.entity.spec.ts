import { OrderStatus, PaymentStatus } from '@prisma/client';
import { OrderEntity, OrderItemEntity } from './order.entity';

describe('OrderItemEntity', () => {
  it('should be defined', () => {
    expect(OrderItemEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of OrderItemEntity with all properties assigned', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const itemData: Partial<OrderItemEntity> = {
        id: 'item-1',
        orderId: 'order-123',
        variantId: 'variant-456',
        quantity: 3,
        price: 150,
        total: 450,
        createdAt,
        variant: {
          id: 'variant-456',
          sku: 'SKU-001',
          name: 'Variant Name',
        },
      };

      const entity = new OrderItemEntity(itemData);

      expect(entity).toBeInstanceOf(OrderItemEntity);
      expect(entity.id).toBe('item-1');
      expect(entity.orderId).toBe('order-123');
      expect(entity.variantId).toBe('variant-456');
      expect(entity.quantity).toBe(3);
      expect(entity.price).toBe(150);
      expect(entity.total).toBe(450);
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.variant).toEqual({
        id: 'variant-456',
        sku: 'SKU-001',
        name: 'Variant Name',
      });
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const partialData: Partial<OrderItemEntity> = {
        id: 'item-2',
        orderId: 'order-123',
        variantId: 'variant-789',
        quantity: 1,
        price: 99.99,
        total: 99.99,
        createdAt,
      };

      const entity = new OrderItemEntity(partialData);

      expect(entity).toBeInstanceOf(OrderItemEntity);
      expect(entity.id).toBe('item-2');
      expect(entity.orderId).toBe('order-123');
      expect(entity.variantId).toBe('variant-789');
      expect(entity.quantity).toBe(1);
      expect(entity.price).toBe(99.99);
      expect(entity.total).toBe(99.99);
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.variant).toBeUndefined();
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new OrderItemEntity({});

      expect(entity).toBeInstanceOf(OrderItemEntity);
      expect(entity.id).toBeUndefined();
      expect(entity.orderId).toBeUndefined();
      expect(entity.variantId).toBeUndefined();
      expect(entity.quantity).toBeUndefined();
      expect(entity.price).toBeUndefined();
      expect(entity.total).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.variant).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<OrderItemEntity> = {
        id: 'item-partial',
        price: 50,
      };

      const entity = new OrderItemEntity(partialData);

      expect(entity).toBeInstanceOf(OrderItemEntity);
      expect(entity.id).toBe('item-partial');
      expect(entity.price).toBe(50);
      expect(entity.orderId).toBeUndefined();
      expect(entity.variantId).toBeUndefined();
      expect(entity.quantity).toBeUndefined();
      expect(entity.total).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.variant).toBeUndefined();
    });

    it('should handle zero values correctly', () => {
      const entity = new OrderItemEntity({
        id: 'item-zero',
        orderId: 'order-zero',
        variantId: 'variant-zero',
        quantity: 0,
        price: 0,
        total: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      expect(entity).toBeInstanceOf(OrderItemEntity);
      expect(entity.quantity).toBe(0);
      expect(entity.price).toBe(0);
      expect(entity.total).toBe(0);
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new OrderItemEntity(
        null as unknown as Partial<OrderItemEntity>,
      );
      expect(entityNull).toBeInstanceOf(OrderItemEntity);

      const entityUndefined = new OrderItemEntity(
        undefined as unknown as Partial<OrderItemEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(OrderItemEntity);
    });
  });
});

describe('OrderEntity', () => {
  it('should be defined', () => {
    expect(OrderEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of OrderEntity with all properties assigned', () => {
      const createdAt = new Date('2026-01-01T10:00:00.000Z');
      const updatedAt = new Date('2026-01-01T11:00:00.000Z');
      const itemCreatedAt = new Date('2026-01-01T10:00:00.000Z');

      const item = new OrderItemEntity({
        id: 'item-1',
        orderId: 'order-123',
        variantId: 'variant-456',
        quantity: 2,
        price: 100,
        total: 200,
        createdAt: itemCreatedAt,
      });

      const orderData: Partial<OrderEntity> = {
        id: 'order-123',
        orderNumber: 'ORD-2026-0001',
        userId: 'user-456',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 200,
        discount: 20,
        shippingFee: 15,
        total: 195,
        couponCode: 'PROMO20',
        addressJson: {
          recipientName: 'Jane Doe',
          phone: '0123456789',
          street: '123 Main St',
          city: 'Anytown',
          province: 'State',
          postalCode: '12345',
        },
        notes: 'Please leave at the front door.',
        createdAt,
        updatedAt,
        items: [item],
        user: {
          id: 'user-456',
          email: 'jane@example.com',
          fullName: 'Jane Doe',
        },
        coupon: {
          code: 'PROMO20',
          discount: 20,
        },
      };

      const entity = new OrderEntity(orderData);

      expect(entity).toBeInstanceOf(OrderEntity);
      expect(entity.id).toBe('order-123');
      expect(entity.orderNumber).toBe('ORD-2026-0001');
      expect(entity.userId).toBe('user-456');
      expect(entity.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(entity.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(entity.subtotal).toBe(200);
      expect(entity.discount).toBe(20);
      expect(entity.shippingFee).toBe(15);
      expect(entity.total).toBe(195);
      expect(entity.couponCode).toBe('PROMO20');
      expect(entity.addressJson).toEqual({
        recipientName: 'Jane Doe',
        phone: '0123456789',
        street: '123 Main St',
        city: 'Anytown',
        province: 'State',
        postalCode: '12345',
      });
      expect(entity.notes).toBe('Please leave at the front door.');
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.items).toHaveLength(1);
      expect(entity.items?.[0]).toBe(item);
      expect(entity.user).toEqual({
        id: 'user-456',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
      });
      expect(entity.coupon).toEqual({
        code: 'PROMO20',
        discount: 20,
      });
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-01T10:00:00.000Z');
      const updatedAt = new Date('2026-01-01T10:00:00.000Z');

      const partialData: Partial<OrderEntity> = {
        id: 'order-req-only',
        orderNumber: 'ORD-2026-0002',
        userId: 'user-111',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        subtotal: 50,
        discount: 0,
        shippingFee: 0,
        total: 50,
        addressJson: { address: 'Some address' },
        createdAt,
        updatedAt,
      };

      const entity = new OrderEntity(partialData);

      expect(entity).toBeInstanceOf(OrderEntity);
      expect(entity.id).toBe('order-req-only');
      expect(entity.orderNumber).toBe('ORD-2026-0002');
      expect(entity.userId).toBe('user-111');
      expect(entity.status).toBe(OrderStatus.PAID);
      expect(entity.paymentStatus).toBe(PaymentStatus.COMPLETED);
      expect(entity.subtotal).toBe(50);
      expect(entity.discount).toBe(0);
      expect(entity.shippingFee).toBe(0);
      expect(entity.total).toBe(50);
      expect(entity.addressJson).toEqual({ address: 'Some address' });
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
      expect(entity.couponCode).toBeUndefined();
      expect(entity.notes).toBeUndefined();
      expect(entity.items).toBeUndefined();
      expect(entity.user).toBeUndefined();
      expect(entity.coupon).toBeUndefined();
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new OrderEntity({});

      expect(entity).toBeInstanceOf(OrderEntity);
      expect(entity.id).toBeUndefined();
      expect(entity.orderNumber).toBeUndefined();
      expect(entity.userId).toBeUndefined();
      expect(entity.status).toBeUndefined();
      expect(entity.paymentStatus).toBeUndefined();
      expect(entity.subtotal).toBeUndefined();
      expect(entity.discount).toBeUndefined();
      expect(entity.shippingFee).toBeUndefined();
      expect(entity.total).toBeUndefined();
      expect(entity.couponCode).toBeUndefined();
      expect(entity.addressJson).toBeUndefined();
      expect(entity.notes).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
      expect(entity.items).toBeUndefined();
      expect(entity.user).toBeUndefined();
      expect(entity.coupon).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<OrderEntity> = {
        orderNumber: 'ORD-PARTIAL',
        status: OrderStatus.DELIVERED,
      };

      const entity = new OrderEntity(partialData);

      expect(entity).toBeInstanceOf(OrderEntity);
      expect(entity.orderNumber).toBe('ORD-PARTIAL');
      expect(entity.status).toBe(OrderStatus.DELIVERED);
      expect(entity.id).toBeUndefined();
      expect(entity.userId).toBeUndefined();
      expect(entity.paymentStatus).toBeUndefined();
    });

    it('should handle zero numerical values properly', () => {
      const entity = new OrderEntity({
        subtotal: 0,
        discount: 0,
        shippingFee: 0,
        total: 0,
      });

      expect(entity).toBeInstanceOf(OrderEntity);
      expect(entity.subtotal).toBe(0);
      expect(entity.discount).toBe(0);
      expect(entity.shippingFee).toBe(0);
      expect(entity.total).toBe(0);
    });

    it('should correctly store various OrderStatus and PaymentStatus values', () => {
      const statuses: OrderStatus[] = [
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PAID,
        OrderStatus.PACKING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELED,
        OrderStatus.REFUNDED,
      ];

      for (const status of statuses) {
        const entity = new OrderEntity({ status });
        expect(entity.status).toBe(status);
      }

      const paymentStatuses: PaymentStatus[] = [
        PaymentStatus.PENDING,
        PaymentStatus.COMPLETED,
        PaymentStatus.FAILED,
        PaymentStatus.REFUNDED,
      ];

      for (const paymentStatus of paymentStatuses) {
        const entity = new OrderEntity({ paymentStatus });
        expect(entity.paymentStatus).toBe(paymentStatus);
      }
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new OrderEntity(
        null as unknown as Partial<OrderEntity>,
      );
      expect(entityNull).toBeInstanceOf(OrderEntity);

      const entityUndefined = new OrderEntity(
        undefined as unknown as Partial<OrderEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(OrderEntity);
    });
  });
});
