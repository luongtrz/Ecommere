import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';
import { PaginationDto, PaginatedResponseDto } from './pagination.dto';

describe('Pagination DTOs', () => {
  describe('PaginationDto', () => {
    it('should initialize with default values when instantiated via constructor', () => {
      const dto = new PaginationDto();

      expect(dto).toBeDefined();
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
    });

    it('should allow setting custom page and limit values', () => {
      const dto = new PaginationDto();
      dto.page = 3;
      dto.limit = 50;

      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(50);
    });

    it('should transform plain string numbers to number primitives via class-transformer', () => {
      const plain = { page: '5', limit: '25' };
      const instance = plainToInstance(PaginationDto, plain);

      expect(instance).toBeInstanceOf(PaginationDto);
      expect(instance.page).toBe(5);
      expect(typeof instance.page).toBe('number');
      expect(instance.limit).toBe(25);
      expect(typeof instance.limit).toBe('number');
    });

    it('should transform single field (page only) via plainToInstance', () => {
      const plain = { page: '4' };
      const instance = plainToInstance(PaginationDto, plain);

      expect(instance).toBeInstanceOf(PaginationDto);
      expect(instance.page).toBe(4);
      expect(instance.limit).toBe(20);
    });

    it('should transform single field (limit only) via plainToInstance', () => {
      const plain = { limit: '35' };
      const instance = plainToInstance(PaginationDto, plain);

      expect(instance).toBeInstanceOf(PaginationDto);
      expect(instance.page).toBe(1);
      expect(instance.limit).toBe(35);
    });

    it('should transform plain input through NestJS ValidationPipe with transform enabled', async () => {
      const pipe = new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      });

      const transformed = await pipe.transform(
        { page: '2', limit: '10' },
        { type: 'query', metatype: PaginationDto },
      );

      expect(transformed).toBeInstanceOf(PaginationDto);
      expect(transformed.page).toBe(2);
      expect(transformed.limit).toBe(10);
    });

    it('should directly evaluate @Type metadata type functions registered on PaginationDto', () => {
      let defaultMetadataStorage: any;
      try {
        defaultMetadataStorage =
          // eslint-disable-next-line @typescript-eslint/no-var-requires -- class-transformer keeps its metadata storage in an internal module
          require('class-transformer/cjs/storage').defaultMetadataStorage;
      } catch {
        try {
          defaultMetadataStorage =
            // eslint-disable-next-line @typescript-eslint/no-var-requires -- class-transformer keeps its metadata storage in an internal module
            require('class-transformer/storage').defaultMetadataStorage;
        } catch {
          // ignore if module path differs
        }
      }

      if (
        defaultMetadataStorage &&
        typeof defaultMetadataStorage.getTargetTypeMetadatas === 'function'
      ) {
        const metadatas =
          defaultMetadataStorage.getTargetTypeMetadatas(PaginationDto);
        expect(metadatas.length).toBeGreaterThanOrEqual(2);

        for (const meta of metadatas) {
          if (typeof meta.typeFunction === 'function') {
            const evaluatedType = meta.typeFunction();
            expect(evaluatedType).toBe(Number);
          }
        }
      }
    });

    describe('validation rules', () => {
      it('should validate successfully with default values', async () => {
        const dto = new PaginationDto();
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('should validate successfully with valid boundary values', async () => {
        const minDto = plainToInstance(PaginationDto, { page: 1, limit: 1 });
        const minErrors = await validate(minDto);
        expect(minErrors).toHaveLength(0);

        const maxDto = plainToInstance(PaginationDto, {
          page: 100,
          limit: 100,
        });
        const maxErrors = await validate(maxDto);
        expect(maxErrors).toHaveLength(0);
      });

      it('should fail validation when page is less than 1', async () => {
        const dto = plainToInstance(PaginationDto, { page: 0 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints).toHaveProperty('min');
      });

      it('should fail validation when page is not an integer', async () => {
        const dto = plainToInstance(PaginationDto, { page: 1.5 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const pageError = errors.find((e) => e.property === 'page');
        expect(pageError).toBeDefined();
        expect(pageError?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when limit is less than 1', async () => {
        const dto = plainToInstance(PaginationDto, { limit: 0 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints).toHaveProperty('min');
      });

      it('should fail validation when limit is greater than 100', async () => {
        const dto = plainToInstance(PaginationDto, { limit: 101 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints).toHaveProperty('max');
      });

      it('should fail validation when limit is not an integer', async () => {
        const dto = plainToInstance(PaginationDto, { limit: 20.8 });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const limitError = errors.find((e) => e.property === 'limit');
        expect(limitError).toBeDefined();
        expect(limitError?.constraints).toHaveProperty('isInt');
      });
    });
  });

  describe('PaginatedResponseDto', () => {
    it('should correctly construct response for first page of multi-page results', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const total = 50;
      const page = 1;
      const limit = 10;

      const response = new PaginatedResponseDto(items, total, page, limit);

      expect(response.data).toEqual(items);
      expect(response.total).toBe(50);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(10);
      expect(response.totalPages).toBe(5);
      expect(response.hasNextPage).toBe(true);
      expect(response.hasPreviousPage).toBe(false);
    });

    it('should correctly construct response for middle page', () => {
      const items = [{ id: '21', name: 'Item 21' }];
      const total = 50;
      const page = 3;
      const limit = 10;

      const response = new PaginatedResponseDto(items, total, page, limit);

      expect(response.data).toEqual(items);
      expect(response.totalPages).toBe(5);
      expect(response.hasNextPage).toBe(true);
      expect(response.hasPreviousPage).toBe(true);
    });

    it('should correctly construct response for last page', () => {
      const items = [{ id: '41', name: 'Item 41' }];
      const total = 50;
      const page = 5;
      const limit = 10;

      const response = new PaginatedResponseDto(items, total, page, limit);

      expect(response.data).toEqual(items);
      expect(response.totalPages).toBe(5);
      expect(response.hasNextPage).toBe(false);
      expect(response.hasPreviousPage).toBe(true);
    });

    it('should correctly construct response for single page dataset (total <= limit)', () => {
      const items = [{ id: '1', name: 'Item 1' }];
      const total = 5;
      const page = 1;
      const limit = 10;

      const response = new PaginatedResponseDto(items, total, page, limit);

      expect(response.totalPages).toBe(1);
      expect(response.hasNextPage).toBe(false);
      expect(response.hasPreviousPage).toBe(false);
    });

    it('should correctly construct response for empty dataset (total = 0)', () => {
      const items: string[] = [];
      const total = 0;
      const page = 1;
      const limit = 20;

      const response = new PaginatedResponseDto(items, total, page, limit);

      expect(response.data).toEqual([]);
      expect(response.total).toBe(0);
      expect(response.totalPages).toBe(0);
      expect(response.hasNextPage).toBe(false);
      expect(response.hasPreviousPage).toBe(false);
    });

    it('should correctly calculate totalPages using Math.ceil when total is not evenly divisible by limit', () => {
      const res1 = new PaginatedResponseDto([], 21, 1, 10);
      expect(res1.totalPages).toBe(3);

      const res2 = new PaginatedResponseDto([], 20, 1, 10);
      expect(res2.totalPages).toBe(2);

      const res3 = new PaginatedResponseDto([], 1, 1, 10);
      expect(res3.totalPages).toBe(1);
    });

    it('should correctly handle page numbers beyond totalPages', () => {
      const total = 30;
      const page = 4;
      const limit = 10;

      const response = new PaginatedResponseDto([], total, page, limit);

      expect(response.totalPages).toBe(3);
      expect(response.hasNextPage).toBe(false);
      expect(response.hasPreviousPage).toBe(true);
    });

    it('should correctly handle page number 0 or negative', () => {
      const total = 20;
      const page = 0;
      const limit = 10;

      const response = new PaginatedResponseDto([], total, page, limit);

      expect(response.totalPages).toBe(2);
      expect(response.hasNextPage).toBe(true);
      expect(response.hasPreviousPage).toBe(false);
    });

    it('should expose hasPreviousPage and not expose hasPrevPage', () => {
      const response = new PaginatedResponseDto(['test'], 10, 2, 5);
      expect(response.hasPreviousPage).toBe(true);
      expect((response as any).hasPrevPage).toBeUndefined();
    });
  });
});
