import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LowStockQueryDto } from './low-stock-query.dto';

describe('LowStockQueryDto', () => {
  it('should have default threshold=10 and limit=100 on direct instantiation', () => {
    const dto = new LowStockQueryDto();

    expect(dto.threshold).toBe(10);
    expect(dto.limit).toBe(100);
  });

  it('should pass validation with default values on direct instantiation', async () => {
    const dto = new LowStockQueryDto();
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should assign default values and pass validation when transforming empty object', async () => {
    const dto = plainToInstance(LowStockQueryDto, {});

    expect(dto.threshold).toBe(10);
    expect(dto.limit).toBe(100);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid numeric threshold and limit', async () => {
    const dto = plainToInstance(LowStockQueryDto, {
      threshold: 5,
      limit: 50,
    });

    expect(dto.threshold).toBe(5);
    expect(dto.limit).toBe(50);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should transform numeric string inputs into numbers via @Type', async () => {
    const dto = plainToInstance(LowStockQueryDto, {
      threshold: '15',
      limit: '250',
    });

    expect(dto.threshold).toBe(15);
    expect(dto.limit).toBe(250);
    expect(typeof dto.threshold).toBe('number');
    expect(typeof dto.limit).toBe('number');

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept minimum boundary values (threshold=0, limit=1)', async () => {
    const dto = plainToInstance(LowStockQueryDto, {
      threshold: 0,
      limit: 1,
    });

    expect(dto.threshold).toBe(0);
    expect(dto.limit).toBe(1);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept maximum boundary value for limit (limit=500)', async () => {
    const dto = plainToInstance(LowStockQueryDto, {
      threshold: 20,
      limit: 500,
    });

    expect(dto.threshold).toBe(20);
    expect(dto.limit).toBe(500);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept large valid threshold values (no upper bound constraint)', async () => {
    const dto = plainToInstance(LowStockQueryDto, {
      threshold: 99999,
      limit: 100,
    });

    expect(dto.threshold).toBe(99999);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation when properties are explicitly undefined', async () => {
    const dto = plainToInstance(LowStockQueryDto, {
      threshold: undefined,
      limit: undefined,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation when only threshold is provided and preserve limit default', async () => {
    const dto = plainToInstance(LowStockQueryDto, { threshold: 25 });

    expect(dto.threshold).toBe(25);
    expect(dto.limit).toBe(100);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation when only limit is provided and preserve threshold default', async () => {
    const dto = plainToInstance(LowStockQueryDto, { limit: 200 });

    expect(dto.threshold).toBe(10);
    expect(dto.limit).toBe(200);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('validation failures on threshold', () => {
    it('should fail validation when threshold is negative (threshold=-1)', async () => {
      const dto = plainToInstance(LowStockQueryDto, { threshold: -1 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const thresholdError = errors.find((e) => e.property === 'threshold');
      expect(thresholdError).toBeDefined();
      expect(thresholdError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when threshold is not an integer', async () => {
      const dto = plainToInstance(LowStockQueryDto, { threshold: 4.5 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const thresholdError = errors.find((e) => e.property === 'threshold');
      expect(thresholdError).toBeDefined();
      expect(thresholdError?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when threshold is a non-numeric string', async () => {
      const dto = plainToInstance(LowStockQueryDto, {
        threshold: 'not-a-number',
      });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const thresholdError = errors.find((e) => e.property === 'threshold');
      expect(thresholdError).toBeDefined();
      expect(thresholdError?.constraints?.isInt).toBeDefined();
    });
  });

  describe('validation failures on limit', () => {
    it('should fail validation when limit is less than 1 (limit=0)', async () => {
      const dto = plainToInstance(LowStockQueryDto, { limit: 0 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when limit is negative', async () => {
      const dto = plainToInstance(LowStockQueryDto, { limit: -10 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.min).toBeDefined();
    });

    it('should fail validation when limit exceeds maximum (limit=501)', async () => {
      const dto = plainToInstance(LowStockQueryDto, { limit: 501 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.max).toBeDefined();
    });

    it('should fail validation when limit is not an integer', async () => {
      const dto = plainToInstance(LowStockQueryDto, { limit: 50.7 });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.isInt).toBeDefined();
    });

    it('should fail validation when limit is a non-numeric string', async () => {
      const dto = plainToInstance(LowStockQueryDto, { limit: 'invalid' });
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === 'limit');
      expect(limitError).toBeDefined();
      expect(limitError?.constraints?.isInt).toBeDefined();
    });
  });

  it('should fail validation on both fields when both are invalid', async () => {
    const dto = plainToInstance(LowStockQueryDto, {
      threshold: -5,
      limit: 600,
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(2);
    const props = errors.map((e) => e.property);
    expect(props).toContain('threshold');
    expect(props).toContain('limit');
  });
});
