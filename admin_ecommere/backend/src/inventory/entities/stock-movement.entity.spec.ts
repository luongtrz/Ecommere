import { StockMovementType } from '@prisma/client';
import { StockMovementEntity } from './stock-movement.entity';

describe('StockMovementEntity', () => {
  it('should be defined', () => {
    expect(StockMovementEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance of StockMovementEntity with all properties assigned', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const data: Partial<StockMovementEntity> = {
        id: 'sm-1',
        variantId: 'var-100',
        type: StockMovementType.IN,
        quantity: 50,
        previousStock: 10,
        newStock: 60,
        orderId: 'ord-999',
        notes: 'Restock shipment received',
        createdAt,
      };

      const entity = new StockMovementEntity(data);

      expect(entity).toBeInstanceOf(StockMovementEntity);
      expect(entity.id).toBe('sm-1');
      expect(entity.variantId).toBe('var-100');
      expect(entity.type).toBe(StockMovementType.IN);
      expect(entity.quantity).toBe(50);
      expect(entity.previousStock).toBe(10);
      expect(entity.newStock).toBe(60);
      expect(entity.orderId).toBe('ord-999');
      expect(entity.notes).toBe('Restock shipment received');
      expect(entity.createdAt).toEqual(createdAt);
      expect(entity).toEqual(data);
    });

    it('should create an instance with only required properties and omit optional fields', () => {
      const createdAt = new Date('2026-01-02T12:00:00.000Z');
      const data: Partial<StockMovementEntity> = {
        id: 'sm-2',
        variantId: 'var-200',
        type: StockMovementType.OUT,
        quantity: 5,
        previousStock: 20,
        newStock: 15,
        createdAt,
      };

      const entity = new StockMovementEntity(data);

      expect(entity).toBeInstanceOf(StockMovementEntity);
      expect(entity.id).toBe('sm-2');
      expect(entity.variantId).toBe('var-200');
      expect(entity.type).toBe(StockMovementType.OUT);
      expect(entity.quantity).toBe(5);
      expect(entity.previousStock).toBe(20);
      expect(entity.newStock).toBe(15);
      expect(entity.orderId).toBeUndefined();
      expect(entity.notes).toBeUndefined();
      expect(entity.createdAt).toEqual(createdAt);
    });

    it('should create an empty entity when instantiated with an empty object', () => {
      const entity = new StockMovementEntity({});

      expect(entity).toBeInstanceOf(StockMovementEntity);
      expect(entity.id).toBeUndefined();
      expect(entity.variantId).toBeUndefined();
      expect(entity.type).toBeUndefined();
      expect(entity.quantity).toBeUndefined();
      expect(entity.previousStock).toBeUndefined();
      expect(entity.newStock).toBeUndefined();
      expect(entity.orderId).toBeUndefined();
      expect(entity.notes).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
    });

    it('should assign partial fields accurately', () => {
      const partialData: Partial<StockMovementEntity> = {
        variantId: 'var-300',
        type: StockMovementType.ADJUST,
        notes: 'Manual inventory adjustment',
      };

      const entity = new StockMovementEntity(partialData);

      expect(entity).toBeInstanceOf(StockMovementEntity);
      expect(entity.variantId).toBe('var-300');
      expect(entity.type).toBe(StockMovementType.ADJUST);
      expect(entity.notes).toBe('Manual inventory adjustment');
      expect(entity.id).toBeUndefined();
      expect(entity.quantity).toBeUndefined();
      expect(entity.previousStock).toBeUndefined();
      expect(entity.newStock).toBeUndefined();
      expect(entity.orderId).toBeUndefined();
      expect(entity.createdAt).toBeUndefined();
    });

    it('should support StockMovementType enum values properly', () => {
      const movementTypes: StockMovementType[] = [
        StockMovementType.IN,
        StockMovementType.OUT,
        StockMovementType.ADJUST,
      ];

      for (const type of movementTypes) {
        const entity = new StockMovementEntity({ type });
        expect(entity.type).toBe(type);
      }
    });

    it('should handle zero quantities and stock levels correctly', () => {
      const entity = new StockMovementEntity({
        quantity: 0,
        previousStock: 0,
        newStock: 0,
      });

      expect(entity).toBeInstanceOf(StockMovementEntity);
      expect(entity.quantity).toBe(0);
      expect(entity.previousStock).toBe(0);
      expect(entity.newStock).toBe(0);
    });

    it('should handle null or undefined partial gracefully without throwing', () => {
      const entityNull = new StockMovementEntity(
        null as unknown as Partial<StockMovementEntity>,
      );
      expect(entityNull).toBeInstanceOf(StockMovementEntity);

      const entityUndefined = new StockMovementEntity(
        undefined as unknown as Partial<StockMovementEntity>,
      );
      expect(entityUndefined).toBeInstanceOf(StockMovementEntity);
    });
  });
});
