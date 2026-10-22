import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { UpdateOrderStatusDto } from './update-order-status.dto';

describe('UpdateOrderStatusDto', () => {
  describe('instantiation', () => {
    it('should instantiate directly', () => {
      const dto = new UpdateOrderStatusDto();

      expect(dto).toBeDefined();
      expect(dto).toBeInstanceOf(UpdateOrderStatusDto);
      expect(dto.status).toBeUndefined();
    });

    it('should allow setting status directly', () => {
      const dto = new UpdateOrderStatusDto();
      dto.status = OrderStatus.PAID;

      expect(dto.status).toBe(OrderStatus.PAID);
    });
  });

  describe('validation - success scenarios', () => {
    it('should pass validation when instantiated directly with valid status', async () => {
      const dto = new UpdateOrderStatusDto();
      dto.status = OrderStatus.SHIPPED;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it.each(Object.values(OrderStatus))(
      'should accept valid OrderStatus enum value: %s',
      async (status) => {
        const dto = plainToInstance(UpdateOrderStatusDto, { status });

        expect(dto.status).toBe(status);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('validation - failure scenarios', () => {
    it('should fail validation when status is missing (empty object)', async () => {
      const dto = plainToInstance(UpdateOrderStatusDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      const statusError = errors.find((e) => e.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when status is undefined', async () => {
      const dto = plainToInstance(UpdateOrderStatusDto, { status: undefined });

      const errors = await validate(dto);
      const statusError = errors.find((e) => e.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when status is null', async () => {
      const dto = plainToInstance(UpdateOrderStatusDto, { status: null });

      const errors = await validate(dto);
      const statusError = errors.find((e) => e.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when status is empty string', async () => {
      const dto = plainToInstance(UpdateOrderStatusDto, { status: '' });

      const errors = await validate(dto);
      const statusError = errors.find((e) => e.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });

    it.each([
      'INVALID_STATUS',
      'COMPLETED',
      'WAITING',
      'PROCESSING',
      'paid',
      'shipped',
      'Pending_Payment',
    ])(
      'should fail validation when status is invalid string: "%s"',
      async (invalidStatus) => {
        const dto = plainToInstance(UpdateOrderStatusDto, {
          status: invalidStatus,
        });

        const errors = await validate(dto);
        const statusError = errors.find((e) => e.property === 'status');
        expect(statusError).toBeDefined();
        expect(statusError?.constraints).toHaveProperty('isEnum');
      },
    );

    it('should fail validation when status is a number', async () => {
      const dto = plainToInstance(UpdateOrderStatusDto, { status: 1 });

      const errors = await validate(dto);
      const statusError = errors.find((e) => e.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when status is a boolean', async () => {
      const dto = plainToInstance(UpdateOrderStatusDto, { status: true });

      const errors = await validate(dto);
      const statusError = errors.find((e) => e.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when status is an object', async () => {
      const dto = plainToInstance(UpdateOrderStatusDto, {
        status: { value: 'PAID' },
      });

      const errors = await validate(dto);
      const statusError = errors.find((e) => e.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when status is an array', async () => {
      const dto = plainToInstance(UpdateOrderStatusDto, {
        status: [OrderStatus.PAID],
      });

      const errors = await validate(dto);
      const statusError = errors.find((e) => e.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toHaveProperty('isEnum');
    });
  });
});
