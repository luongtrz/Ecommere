import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomerQueryDto } from './customer-query.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

describe('CustomerQueryDto', () => {
  it('should instantiate and inherit default pagination values from PaginationDto', () => {
    const dto = new CustomerQueryDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(PaginationDto);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.search).toBeUndefined();
  });

  describe('valid scenarios', () => {
    it('should validate successfully with an empty object using defaults', async () => {
      const dto = plainToInstance(CustomerQueryDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.search).toBeUndefined();
    });

    it('should validate successfully when search string is provided', async () => {
      const dto = plainToInstance(CustomerQueryDto, {
        search: 'Nguyen Van A',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.search).toBe('Nguyen Van A');
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
    });

    it('should validate successfully when search is an empty string', async () => {
      const dto = plainToInstance(CustomerQueryDto, {
        search: '',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.search).toBe('');
    });

    it('should validate successfully with all fields provided', async () => {
      const dto = plainToInstance(CustomerQueryDto, {
        search: 'customer@example.com',
        page: 3,
        limit: 50,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.search).toBe('customer@example.com');
      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(50);
    });

    it('should transform numeric string page and limit to numbers', async () => {
      const dto = plainToInstance(CustomerQueryDto, {
        search: '0987654321',
        page: '5',
        limit: '15',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(5);
      expect(typeof dto.page).toBe('number');
      expect(dto.limit).toBe(15);
      expect(typeof dto.limit).toBe('number');
    });

    it('should validate successfully with boundary pagination values (page: 1, limit: 1 and limit: 100)', async () => {
      const dtoMin = plainToInstance(CustomerQueryDto, {
        page: 1,
        limit: 1,
      });
      expect(await validate(dtoMin)).toHaveLength(0);

      const dtoMax = plainToInstance(CustomerQueryDto, {
        page: 100,
        limit: 100,
      });
      expect(await validate(dtoMax)).toHaveLength(0);
    });
  });

  describe('validation failure scenarios', () => {
    describe('search property', () => {
      it('should fail when search is not a string', async () => {
        const invalidSearches = [12345, true, {}, []];

        for (const invalidSearch of invalidSearches) {
          const dto = plainToInstance(CustomerQueryDto, {
            search: invalidSearch as any,
          });
          const errors = await validate(dto);
          const error = errors.find((e) => e.property === 'search');
          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('isString');
        }
      });
    });

    describe('inherited page property', () => {
      it('should fail when page is less than 1', async () => {
        const dtoZero = plainToInstance(CustomerQueryDto, { page: 0 });
        const errorsZero = await validate(dtoZero);
        const errorZero = errorsZero.find((e) => e.property === 'page');
        expect(errorZero).toBeDefined();
        expect(errorZero?.constraints).toHaveProperty('min');

        const dtoNegative = plainToInstance(CustomerQueryDto, { page: -1 });
        const errorsNegative = await validate(dtoNegative);
        const errorNegative = errorsNegative.find((e) => e.property === 'page');
        expect(errorNegative).toBeDefined();
        expect(errorNegative?.constraints).toHaveProperty('min');
      });

      it('should fail when page is not an integer', async () => {
        const dtoFloat = plainToInstance(CustomerQueryDto, { page: 2.5 });
        const errorsFloat = await validate(dtoFloat);
        const errorFloat = errorsFloat.find((e) => e.property === 'page');
        expect(errorFloat).toBeDefined();
        expect(errorFloat?.constraints).toHaveProperty('isInt');
      });

      it('should fail when page is a non-numeric string', async () => {
        const dtoString = plainToInstance(CustomerQueryDto, {
          page: 'invalid-number',
        });
        const errors = await validate(dtoString);
        const error = errors.find((e) => e.property === 'page');
        expect(error).toBeDefined();
        expect(error?.constraints).toBeDefined();
      });
    });

    describe('inherited limit property', () => {
      it('should fail when limit is less than 1', async () => {
        const dtoZero = plainToInstance(CustomerQueryDto, { limit: 0 });
        const errorsZero = await validate(dtoZero);
        const errorZero = errorsZero.find((e) => e.property === 'limit');
        expect(errorZero).toBeDefined();
        expect(errorZero?.constraints).toHaveProperty('min');

        const dtoNegative = plainToInstance(CustomerQueryDto, { limit: -10 });
        const errorsNegative = await validate(dtoNegative);
        const errorNegative = errorsNegative.find((e) => e.property === 'limit');
        expect(errorNegative).toBeDefined();
        expect(errorNegative?.constraints).toHaveProperty('min');
      });

      it('should fail when limit exceeds 100', async () => {
        const dtoExceed = plainToInstance(CustomerQueryDto, { limit: 101 });
        const errorsExceed = await validate(dtoExceed);
        const errorExceed = errorsExceed.find((e) => e.property === 'limit');
        expect(errorExceed).toBeDefined();
        expect(errorExceed?.constraints).toHaveProperty('max');

        const dtoLarge = plainToInstance(CustomerQueryDto, { limit: 500 });
        const errorsLarge = await validate(dtoLarge);
        const errorLarge = errorsLarge.find((e) => e.property === 'limit');
        expect(errorLarge).toBeDefined();
        expect(errorLarge?.constraints).toHaveProperty('max');
      });

      it('should fail when limit is not an integer', async () => {
        const dtoFloat = plainToInstance(CustomerQueryDto, { limit: 10.5 });
        const errorsFloat = await validate(dtoFloat);
        const errorFloat = errorsFloat.find((e) => e.property === 'limit');
        expect(errorFloat).toBeDefined();
        expect(errorFloat?.constraints).toHaveProperty('isInt');
      });

      it('should fail when limit is a non-numeric string', async () => {
        const dtoString = plainToInstance(CustomerQueryDto, {
          limit: 'invalid-limit',
        });
        const errors = await validate(dtoString);
        const error = errors.find((e) => e.property === 'limit');
        expect(error).toBeDefined();
        expect(error?.constraints).toBeDefined();
      });
    });
  });
});
