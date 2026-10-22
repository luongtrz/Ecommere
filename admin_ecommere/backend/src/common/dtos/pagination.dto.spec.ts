import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationDto, PaginatedResponseDto } from './pagination.dto';

describe('Pagination DTOs', () => {
  describe('PaginationDto', () => {
    it('should have default page=1 and limit=20 on direct instantiation', () => {
      const dto = new PaginationDto();

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
    });

    it('should pass validation with default values', async () => {
      const dto = new PaginationDto();
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should assign default values and pass validation when transforming empty object', async () => {
      const dto = plainToInstance(PaginationDto, {});

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept valid numeric page and limit', async () => {
      const dto = plainToInstance(PaginationDto, { page: 3, limit: 50 });

      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(50);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should transform numeric string inputs into numbers via @Type', async () => {
      const dto = plainToInstance(PaginationDto, {
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

    it('should accept minimum boundary values (page=1, limit=1)', async () => {
      const dto = plainToInstance(PaginationDto, { page: 1, limit: 1 });

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(1);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept maximum boundary value for limit (limit=100)', async () => {
      const dto = plainToInstance(PaginationDto, { page: 1, limit: 100 });

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(100);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept large valid page numbers', async () => {
      const dto = plainToInstance(PaginationDto, { page: 999999, limit: 20 });

      expect(dto.page).toBe(999999);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when fields are undefined', async () => {
      const dto = plainToInstance(PaginationDto, {
        page: undefined,
        limit: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when only page is provided', async () => {
      const dto = plainToInstance(PaginationDto, { page: 5 });

      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(20);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when only limit is provided', async () => {
      const dto = plainToInstance(PaginationDto, { limit: 10 });

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    describe('validation failures on page', () => {
      it('should fail validation when page is less than 1 (page=0)', async () => {
        const dto = plainToInstance(PaginationDto, { page: 0 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints?.min).toBeDefined();
      });

      it('should fail validation when page is negative', async () => {
        const dto = plainToInstance(PaginationDto, { page: -5 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints?.min).toBeDefined();
      });

      it('should fail validation when page is not an integer', async () => {
        const dto = plainToInstance(PaginationDto, { page: 1.5 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints?.isInt).toBeDefined();
      });

      it('should fail validation when page is a non-numeric string', async () => {
        const dto = plainToInstance(PaginationDto, { page: 'invalid' });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints?.isInt).toBeDefined();
      });
    });

    describe('validation failures on limit', () => {
      it('should fail validation when limit is less than 1 (limit=0)', async () => {
        const dto = plainToInstance(PaginationDto, { limit: 0 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints?.min).toBeDefined();
      });

      it('should fail validation when limit is negative', async () => {
        const dto = plainToInstance(PaginationDto, { limit: -10 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints?.min).toBeDefined();
      });

      it('should fail validation when limit exceeds maximum (limit=101)', async () => {
        const dto = plainToInstance(PaginationDto, { limit: 101 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints?.max).toBeDefined();
      });

      it('should fail validation when limit is not an integer', async () => {
        const dto = plainToInstance(PaginationDto, { limit: 20.5 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints?.isInt).toBeDefined();
      });

      it('should fail validation when limit is a non-numeric string', async () => {
        const dto = plainToInstance(PaginationDto, { limit: 'abc' });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints?.isInt).toBeDefined();
      });
    });

    it('should fail validation on both fields when both are invalid', async () => {
      const dto = plainToInstance(PaginationDto, { page: 0, limit: 150 });
      const errors = await validate(dto);

      expect(errors).toHaveLength(2);
      const props = errors.map((e) => e.property);
      expect(props).toContain('page');
      expect(props).toContain('limit');
    });
  });

  describe('PaginatedResponseDto', () => {
    interface TestItem {
      id: number;
      name: string;
    }

    const sampleItems: TestItem[] = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    it('should correctly set basic properties in constructor', () => {
      const response = new PaginatedResponseDto(sampleItems, 50, 1, 10);

      expect(response.data).toEqual(sampleItems);
      expect(response.total).toBe(50);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(10);
      expect(response.totalPages).toBe(5);
    });

    describe('pagination navigation branches (hasNextPage & hasPrevPage)', () => {
      it('first page of multi-page: hasNextPage=true, hasPrevPage=false', () => {
        const response = new PaginatedResponseDto(sampleItems, 50, 1, 10);

        expect(response.totalPages).toBe(5);
        expect(response.hasNextPage).toBe(true);
        expect(response.hasPrevPage).toBe(false);
      });

      it('middle page of multi-page: hasNextPage=true, hasPrevPage=true', () => {
        const response = new PaginatedResponseDto(sampleItems, 50, 2, 10);

        expect(response.totalPages).toBe(5);
        expect(response.hasNextPage).toBe(true);
        expect(response.hasPrevPage).toBe(true);
      });

      it('last page of multi-page: hasNextPage=false, hasPrevPage=true', () => {
        const response = new PaginatedResponseDto(sampleItems, 50, 5, 10);

        expect(response.totalPages).toBe(5);
        expect(response.hasNextPage).toBe(false);
        expect(response.hasPrevPage).toBe(true);
      });

      it('page beyond total pages: hasNextPage=false, hasPrevPage=true', () => {
        const response = new PaginatedResponseDto([], 50, 6, 10);

        expect(response.totalPages).toBe(5);
        expect(response.hasNextPage).toBe(false);
        expect(response.hasPrevPage).toBe(true);
      });

      it('single page result: hasNextPage=false, hasPrevPage=false', () => {
        const response = new PaginatedResponseDto(sampleItems, 2, 1, 10);

        expect(response.totalPages).toBe(1);
        expect(response.hasNextPage).toBe(false);
        expect(response.hasPrevPage).toBe(false);
      });

      it('empty result (total=0): hasNextPage=false, hasPrevPage=false', () => {
        const response = new PaginatedResponseDto([], 0, 1, 10);

        expect(response.totalPages).toBe(0);
        expect(response.hasNextPage).toBe(false);
        expect(response.hasPrevPage).toBe(false);
      });

      it('page=0 boundary: hasNextPage=true (0 < totalPages), hasPrevPage=false (0 not > 1)', () => {
        const response = new PaginatedResponseDto([], 20, 0, 10);

        expect(response.totalPages).toBe(2);
        expect(response.hasNextPage).toBe(true);
        expect(response.hasPrevPage).toBe(false);
      });

      it('negative page boundary: hasNextPage=true, hasPrevPage=false', () => {
        const response = new PaginatedResponseDto([], 20, -1, 10);

        expect(response.totalPages).toBe(2);
        expect(response.hasNextPage).toBe(true);
        expect(response.hasPrevPage).toBe(false);
      });
    });

    describe('totalPages calculation with Math.ceil', () => {
      it('should calculate totalPages for exact division (20 / 10 = 2)', () => {
        const response = new PaginatedResponseDto([], 20, 1, 10);
        expect(response.totalPages).toBe(2);
      });

      it('should round up totalPages for remainder (21 / 10 = 3)', () => {
        const response = new PaginatedResponseDto([], 21, 1, 10);
        expect(response.totalPages).toBe(3);
      });

      it('should round up totalPages for single item remainder (11 / 10 = 2)', () => {
        const response = new PaginatedResponseDto([], 11, 1, 10);
        expect(response.totalPages).toBe(2);
      });

      it('should round up totalPages for count less than limit (1 / 10 = 1)', () => {
        const response = new PaginatedResponseDto([], 1, 1, 10);
        expect(response.totalPages).toBe(1);
      });
    });

    it('should pass class-validator validation on instance', async () => {
      const response = new PaginatedResponseDto(sampleItems, 2, 1, 10);
      const errors = await validate(response);

      // PaginatedResponseDto has no class-validator decorators, so validate() yields unknownValue
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.unknownValue).toBe(
        'an unknown value was passed to the validate function',
      );
    });

    it('should transform and match shape with plainToInstance', async () => {
      const plain = {
        data: sampleItems,
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true,
      };

      const instance = plainToInstance(PaginatedResponseDto, plain);

      expect(instance).toBeInstanceOf(PaginatedResponseDto);
      expect(instance.data).toEqual(sampleItems);
      expect(instance.total).toBe(50);
      expect(instance.page).toBe(2);
      expect(instance.limit).toBe(10);
      expect(instance.totalPages).toBe(5);
      expect(instance.hasNextPage).toBe(true);
      expect(instance.hasPrevPage).toBe(true);

      const errors = await validate(instance);
      // PaginatedResponseDto has no class-validator decorators, so validate() yields unknownValue
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.unknownValue).toBe(
        'an unknown value was passed to the validate function',
      );
    });
  });
});
