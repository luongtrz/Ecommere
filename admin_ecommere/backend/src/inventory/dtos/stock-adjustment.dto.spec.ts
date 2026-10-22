import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { StockMovementType } from '@prisma/client';
import { StockAdjustmentDto } from './stock-adjustment.dto';

describe('StockAdjustmentDto', () => {
  it('should instantiate directly with undefined properties', () => {
    const dto = new StockAdjustmentDto();

    expect(dto).toBeDefined();
    expect(dto.variantId).toBeUndefined();
    expect(dto.type).toBeUndefined();
    expect(dto.quantity).toBeUndefined();
    expect(dto.notes).toBeUndefined();
  });

  it('should pass validation when manually populated with valid fields', async () => {
    const dto = new StockAdjustmentDto();
    dto.variantId = 'var-123';
    dto.type = StockMovementType.IN;
    dto.quantity = 10;
    dto.notes = 'Restocked from supplier';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation when plain object with all valid properties is transformed', async () => {
    const plain = {
      variantId: 'variant-abc',
      type: StockMovementType.IN,
      quantity: 10,
      notes: 'Initial inventory load',
    };

    const dto = plainToInstance(StockAdjustmentDto, plain);

    expect(dto.variantId).toBe('variant-abc');
    expect(dto.type).toBe(StockMovementType.IN);
    expect(dto.quantity).toBe(10);
    expect(dto.notes).toBe('Initial inventory load');

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation without optional notes field', async () => {
    const plain = {
      variantId: 'variant-abc',
      type: StockMovementType.OUT,
      quantity: 5,
    };

    const dto = plainToInstance(StockAdjustmentDto, plain);

    expect(dto.notes).toBeUndefined();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation when notes is explicitly undefined', async () => {
    const plain = {
      variantId: 'variant-abc',
      type: StockMovementType.ADJUST,
      quantity: 0,
      notes: undefined,
    };

    const dto = plainToInstance(StockAdjustmentDto, plain);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should transform numeric string quantity into number via @Type', async () => {
    const plain = {
      variantId: 'variant-abc',
      type: StockMovementType.IN,
      quantity: '42',
    };

    const dto = plainToInstance(StockAdjustmentDto, plain);

    expect(dto.quantity).toBe(42);
    expect(typeof dto.quantity).toBe('number');

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept minimum boundary quantity (quantity=0)', async () => {
    const plain = {
      variantId: 'variant-abc',
      type: StockMovementType.ADJUST,
      quantity: 0,
    };

    const dto = plainToInstance(StockAdjustmentDto, plain);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  describe('StockMovementType enum validation', () => {
    it('should accept StockMovementType.IN', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: StockMovementType.IN,
        quantity: 1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept StockMovementType.OUT', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: StockMovementType.OUT,
        quantity: 1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept StockMovementType.ADJUST', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: StockMovementType.ADJUST,
        quantity: 1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when type is not a valid StockMovementType enum value', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: 'INVALID_TYPE',
        quantity: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
      expect(typeError?.constraints?.isEnum).toBeDefined();
    });

    it('should fail validation when type is missing / undefined', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        quantity: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
      expect(typeError?.constraints?.isEnum).toBeDefined();
    });

    it('should fail validation when type is a number or boolean', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: 123 as any,
        quantity: 1,
      });

      const errors = await validate(dto);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
      expect(typeError?.constraints?.isEnum).toBeDefined();
    });
  });

  describe('variantId validation', () => {
    it('should fail validation when variantId is missing / undefined', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        type: StockMovementType.IN,
        quantity: 5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const variantError = errors.find((e) => e.property === 'variantId');
      expect(variantError).toBeDefined();
      expect(variantError?.constraints?.isString).toBeDefined();
    });

    it('should fail validation when variantId is not a string (number)', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 12345 as any,
        type: StockMovementType.IN,
        quantity: 5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const variantError = errors.find((e) => e.property === 'variantId');
      expect(variantError).toBeDefined();
      expect(variantError?.constraints?.isString).toBeDefined();
    });

    it('should fail validation when variantId is an object or boolean', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: { id: 1 } as any,
        type: StockMovementType.IN,
        quantity: 5,
      });

      const errors = await validate(dto);
      const variantError = errors.find((e) => e.property === 'variantId');
      expect(variantError).toBeDefined();
      expect(variantError?.constraints?.isString).toBeDefined();
    });
  });

  describe('quantity validation', () => {
    it('should fail validation when quantity is missing / undefined', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: StockMovementType.IN,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const quantityError = errors.find((e) => e.property === 'quantity');
      expect(quantityError).toBeDefined();
      expect(
        quantityError?.constraints?.isInt || quantityError?.constraints?.min,
      ).toBeDefined();
    });

    it('should fail validation when quantity is negative (quantity=-1)', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: StockMovementType.OUT,
        quantity: -1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const quantityError = errors.find((e) => e.property === 'quantity');
      expect(quantityError).toBeDefined();
      expect(quantityError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when quantity is not an integer (float)', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: StockMovementType.IN,
        quantity: 12.34,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const quantityError = errors.find((e) => e.property === 'quantity');
      expect(quantityError).toBeDefined();
      expect(quantityError?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when quantity is a non-numeric string', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: StockMovementType.IN,
        quantity: 'not-a-number',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const quantityError = errors.find((e) => e.property === 'quantity');
      expect(quantityError).toBeDefined();
      expect(quantityError?.constraints?.isInt).toBeDefined();
    });
  });

  describe('notes validation', () => {
    it('should fail validation when notes is provided but is not a string', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: StockMovementType.IN,
        quantity: 5,
        notes: 12345 as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const notesError = errors.find((e) => e.property === 'notes');
      expect(notesError).toBeDefined();
      expect(notesError?.constraints?.isString).toBeDefined();
    });

    it('should accept empty string as notes', async () => {
      const dto = plainToInstance(StockAdjustmentDto, {
        variantId: 'v-1',
        type: StockMovementType.IN,
        quantity: 5,
        notes: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  it('should fail validation on all required fields when empty object is passed', async () => {
    const dto = plainToInstance(StockAdjustmentDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThanOrEqual(3);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('variantId');
    expect(properties).toContain('type');
    expect(properties).toContain('quantity');
  });

  it('should fail validation on all fields when invalid types are passed for all properties', async () => {
    const dto = plainToInstance(StockAdjustmentDto, {
      variantId: 123 as any,
      type: 'INVALID_ENUM' as any,
      quantity: -10,
      notes: true as any,
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(4);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('variantId');
    expect(properties).toContain('type');
    expect(properties).toContain('quantity');
    expect(properties).toContain('notes');
  });
});
