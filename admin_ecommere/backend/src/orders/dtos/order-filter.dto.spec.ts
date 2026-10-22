import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { OrderFilterDto } from './order-filter.dto';

describe('OrderFilterDto', () => {
  describe('instantiation and inheritance', () => {
    it('should be defined and instantiate directly with default pagination values', () => {
      const dto = new OrderFilterDto();

      expect(dto).toBeDefined();
      expect(dto).toBeInstanceOf(OrderFilterDto);
      expect(dto).toBeInstanceOf(PaginationDto);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.status).toBeUndefined();
      expect(dto.search).toBeUndefined();
    });

    it('should allow setting properties directly', () => {
      const dto = new OrderFilterDto();
      dto.page = 3;
      dto.limit = 50;
      dto.status = OrderStatus.PENDING_PAYMENT;
      dto.search = 'ORDER-12345';

      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(50);
      expect(dto.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(dto.search).toBe('ORDER-12345');
    });
  });

  describe('validation - success scenarios', () => {
    it('should pass validation with default instantiation', async () => {
      const dto = new OrderFilterDto();
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation when transforming empty object', async () => {
      const dto = plainToInstance(OrderFilterDto, {});

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.status).toBeUndefined();
      expect(dto.search).toBeUndefined();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all fields populated validly', async () => {
      const dto = plainToInstance(OrderFilterDto, {
        status: OrderStatus.PAID,
        search: 'customer@example.com',
        page: 2,
        limit: 15,
      });

      expect(dto.status).toBe(OrderStatus.PAID);
      expect(dto.search).toBe('customer@example.com');
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(15);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it.each(Object.values(OrderStatus))(
      'should accept valid OrderStatus enum value: %s',
      async (status) => {
        const dto = plainToInstance(OrderFilterDto, { status });

        expect(dto.status).toBe(status);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      },
    );

    it('should pass validation when only status is provided', async () => {
      const dto = plainToInstance(OrderFilterDto, {
        status: OrderStatus.DELIVERED,
      });

      expect(dto.status).toBe(OrderStatus.DELIVERED);
      expect(dto.search).toBeUndefined();
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when only search is provided', async () => {
      const dto = plainToInstance(OrderFilterDto, {
        search: 'phone-case-001',
      });

      expect(dto.status).toBeUndefined();
      expect(dto.search).toBe('phone-case-001');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with an empty string for search', async () => {
      const dto = plainToInstance(OrderFilterDto, {
        search: '',
      });

      expect(dto.search).toBe('');
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when optional fields are explicitly undefined', async () => {
      const dto = plainToInstance(OrderFilterDto, {
        status: undefined,
        search: undefined,
        page: undefined,
        limit: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should transform numeric strings to numbers for page and limit via inherited decorators', async () => {
      const dto = plainToInstance(OrderFilterDto, {
        page: '4',
        limit: '25',
      });

      expect(dto.page).toBe(4);
      expect(dto.limit).toBe(25);
      expect(typeof dto.page).toBe('number');
      expect(typeof dto.limit).toBe('number');

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept boundary values for page and limit (page=1, limit=1, limit=100)', async () => {
      const dtoMin = plainToInstance(OrderFilterDto, { page: 1, limit: 1 });
      const errorsMin = await validate(dtoMin);
      expect(errorsMin).toHaveLength(0);

      const dtoMaxLimit = plainToInstance(OrderFilterDto, {
        page: 1,
        limit: 100,
      });
      const errorsMax = await validate(dtoMaxLimit);
      expect(errorsMax).toHaveLength(0);
    });
  });

  describe('validation - failure scenarios', () => {
    describe('status field validation failures', () => {
      it('should fail validation when status is an invalid string', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          status: 'INVALID_STATUS',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const statusError = errors.find((e) => e.property === 'status');
        expect(statusError).toBeDefined();
        expect(statusError?.constraints).toHaveProperty('isEnum');
      });

      it.each([
        'PROCESSING',
        'COMPLETED',
        'WAITING',
        'paid',
        'pending_payment',
      ])('should reject non-matching string: %s', async (invalidStatus) => {
        const dto = plainToInstance(OrderFilterDto, {
          status: invalidStatus,
        });

        const errors = await validate(dto);
        const statusError = errors.find((e) => e.property === 'status');
        expect(statusError).toBeDefined();
        expect(statusError?.constraints).toHaveProperty('isEnum');
      });

      it('should fail validation when status is a number', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          status: 12345,
        });

        const errors = await validate(dto);
        const statusError = errors.find((e) => e.property === 'status');
        expect(statusError).toBeDefined();
        expect(statusError?.constraints).toHaveProperty('isEnum');
      });

      it('should fail validation when status is a boolean', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          status: true,
        });

        const errors = await validate(dto);
        const statusError = errors.find((e) => e.property === 'status');
        expect(statusError).toBeDefined();
        expect(statusError?.constraints).toHaveProperty('isEnum');
      });

      it('should fail validation when status is an object', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          status: { value: 'PAID' },
        });

        const errors = await validate(dto);
        const statusError = errors.find((e) => e.property === 'status');
        expect(statusError).toBeDefined();
        expect(statusError?.constraints).toHaveProperty('isEnum');
      });

      it('should fail validation when status is an array', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          status: [OrderStatus.PAID],
        });

        const errors = await validate(dto);
        const statusError = errors.find((e) => e.property === 'status');
        expect(statusError).toBeDefined();
        expect(statusError?.constraints).toHaveProperty('isEnum');
      });
    });

    describe('search field validation failures', () => {
      it('should fail validation when search is a number', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          search: 12345,
        });

        const errors = await validate(dto);
        const searchError = errors.find((e) => e.property === 'search');
        expect(searchError).toBeDefined();
        expect(searchError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when search is a boolean', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          search: false,
        });

        const errors = await validate(dto);
        const searchError = errors.find((e) => e.property === 'search');
        expect(searchError).toBeDefined();
        expect(searchError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when search is an object', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          search: { query: 'test' },
        });

        const errors = await validate(dto);
        const searchError = errors.find((e) => e.property === 'search');
        expect(searchError).toBeDefined();
        expect(searchError?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when search is an array', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          search: ['test', 'order'],
        });

        const errors = await validate(dto);
        const searchError = errors.find((e) => e.property === 'search');
        expect(searchError).toBeDefined();
        expect(searchError?.constraints).toHaveProperty('isString');
      });
    });

    describe('inherited pagination validation failures', () => {
      it('should fail validation when page is less than 1 (page=0)', async () => {
        const dto = plainToInstance(OrderFilterDto, { page: 0 });
        const errors = await validate(dto);

        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints).toHaveProperty('min');
      });

      it('should fail validation when page is negative', async () => {
        const dto = plainToInstance(OrderFilterDto, { page: -5 });
        const errors = await validate(dto);

        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints).toHaveProperty('min');
      });

      it('should fail validation when page is not an integer', async () => {
        const dto = plainToInstance(OrderFilterDto, { page: 2.5 });
        const errors = await validate(dto);

        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when page is a non-numeric string', async () => {
        const dto = plainToInstance(OrderFilterDto, { page: 'invalid' });
        const errors = await validate(dto);

        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when limit is less than 1 (limit=0)', async () => {
        const dto = plainToInstance(OrderFilterDto, { limit: 0 });
        const errors = await validate(dto);

        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints).toHaveProperty('min');
      });

      it('should fail validation when limit exceeds 100 (limit=101)', async () => {
        const dto = plainToInstance(OrderFilterDto, { limit: 101 });
        const errors = await validate(dto);

        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints).toHaveProperty('max');
      });

      it('should fail validation when limit is not an integer', async () => {
        const dto = plainToInstance(OrderFilterDto, { limit: 10.5 });
        const errors = await validate(dto);

        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when limit is a non-numeric string', async () => {
        const dto = plainToInstance(OrderFilterDto, { limit: 'abc' });
        const errors = await validate(dto);

        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints).toHaveProperty('isInt');
      });
    });

    describe('combined failures', () => {
      it('should report multiple validation errors when all fields are invalid', async () => {
        const dto = plainToInstance(OrderFilterDto, {
          status: 'UNSUPPORTED_STATUS',
          search: 12345,
          page: 0,
          limit: 150,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(4);

        const properties = errors.map((e) => e.property);
        expect(properties).toContain('status');
        expect(properties).toContain('search');
        expect(properties).toContain('page');
        expect(properties).toContain('limit');
      });
    });
  });
});
