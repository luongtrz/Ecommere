import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductFilterDto, ProductSortBy } from './product-filter.dto';

describe('ProductFilterDto and ProductSortBy', () => {
  describe('ProductSortBy enum', () => {
    it('should have all expected enum members with matching string values', () => {
      expect(ProductSortBy.NEWEST).toBe('newest');
      expect(ProductSortBy.OLDEST).toBe('oldest');
      expect(ProductSortBy.PRICE_ASC).toBe('price_asc');
      expect(ProductSortBy.PRICE_DESC).toBe('price_desc');
      expect(ProductSortBy.NAME_ASC).toBe('name_asc');
      expect(ProductSortBy.NAME_DESC).toBe('name_desc');
      expect(ProductSortBy.BEST_SELLING).toBe('best_selling');
      expect(ProductSortBy.RATING).toBe('rating');

      expect(Object.values(ProductSortBy)).toEqual([
        'newest',
        'oldest',
        'price_asc',
        'price_desc',
        'name_asc',
        'name_desc',
        'best_selling',
        'rating',
      ]);
    });
  });

  describe('ProductFilterDto', () => {
    it('should instantiate directly with default property values', () => {
      const dto = new ProductFilterDto();

      expect(dto).toBeInstanceOf(ProductFilterDto);
      expect(dto.sortBy).toBe(ProductSortBy.NEWEST);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.search).toBeUndefined();
      expect(dto.categoryId).toBeUndefined();
      expect(dto.categorySlug).toBeUndefined();
      expect(dto.minPrice).toBeUndefined();
      expect(dto.maxPrice).toBeUndefined();
    });

    it('should allow setting and reading all properties on direct instance', () => {
      const dto = new ProductFilterDto();
      dto.search = 'Lavender';
      dto.categoryId = 'cat-123';
      dto.categorySlug = 'air-fresheners';
      dto.sortBy = ProductSortBy.PRICE_ASC;
      dto.minPrice = 50000;
      dto.maxPrice = 200000;
      dto.page = 3;
      dto.limit = 30;

      expect(dto.search).toBe('Lavender');
      expect(dto.categoryId).toBe('cat-123');
      expect(dto.categorySlug).toBe('air-fresheners');
      expect(dto.sortBy).toBe(ProductSortBy.PRICE_ASC);
      expect(dto.minPrice).toBe(50000);
      expect(dto.maxPrice).toBe(200000);
      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(30);
    });

    describe('validation success paths', () => {
      it('should pass validation with empty object and apply default values', async () => {
        const dto = plainToInstance(ProductFilterDto, {});
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.sortBy).toBe(ProductSortBy.NEWEST);
        expect(dto.page).toBe(1);
        expect(dto.limit).toBe(20);
        expect(dto.search).toBeUndefined();
        expect(dto.categoryId).toBeUndefined();
        expect(dto.categorySlug).toBeUndefined();
        expect(dto.minPrice).toBeUndefined();
        expect(dto.maxPrice).toBeUndefined();
      });

      it('should pass validation when all fields are populated with valid values', async () => {
        const payload = {
          search: 'Lemongrass',
          categoryId: 'category-uuid-123',
          categorySlug: 'tinh-dau-thom',
          sortBy: ProductSortBy.BEST_SELLING,
          minPrice: 50000,
          maxPrice: 300000,
          page: 2,
          limit: 15,
        };

        const dto = plainToInstance(ProductFilterDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.search).toBe('Lemongrass');
        expect(dto.categoryId).toBe('category-uuid-123');
        expect(dto.categorySlug).toBe('tinh-dau-thom');
        expect(dto.sortBy).toBe(ProductSortBy.BEST_SELLING);
        expect(dto.minPrice).toBe(50000);
        expect(dto.maxPrice).toBe(300000);
        expect(dto.page).toBe(2);
        expect(dto.limit).toBe(15);
      });

      it.each(Object.values(ProductSortBy))(
        'should pass validation for each valid ProductSortBy value: %s',
        async (sortByValue) => {
          const dto = plainToInstance(ProductFilterDto, {
            sortBy: sortByValue,
          });
          const errors = await validate(dto);

          expect(errors).toHaveLength(0);
          expect(dto.sortBy).toBe(sortByValue);
        },
      );

      it('should pass validation with boundary minPrice and maxPrice (0)', async () => {
        const dto = plainToInstance(ProductFilterDto, {
          minPrice: 0,
          maxPrice: 0,
        });
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.minPrice).toBe(0);
        expect(dto.maxPrice).toBe(0);
      });

      it('should transform numeric string parameters to numbers via @Type', async () => {
        const payload = {
          minPrice: '100000',
          maxPrice: '500000',
          page: '4',
          limit: '25',
        };

        const dto = plainToInstance(ProductFilterDto, payload);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(typeof dto.minPrice).toBe('number');
        expect(dto.minPrice).toBe(100000);
        expect(typeof dto.maxPrice).toBe('number');
        expect(dto.maxPrice).toBe(500000);
        expect(typeof dto.page).toBe('number');
        expect(dto.page).toBe(4);
        expect(typeof dto.limit).toBe('number');
        expect(dto.limit).toBe(25);
      });
    });

    describe('validation failure paths', () => {
      it('should fail validation when search is not a string (number or boolean)', async () => {
        const dtoNum = plainToInstance(ProductFilterDto, { search: 12345 });
        const errorsNum = await validate(dtoNum);
        const searchErrNum = errorsNum.find((e) => e.property === 'search');

        expect(searchErrNum).toBeDefined();
        expect(searchErrNum?.constraints).toHaveProperty('isString');

        const dtoBool = plainToInstance(ProductFilterDto, { search: false });
        const errorsBool = await validate(dtoBool);
        const searchErrBool = errorsBool.find((e) => e.property === 'search');

        expect(searchErrBool).toBeDefined();
        expect(searchErrBool?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when categoryId is not a string', async () => {
        const dto = plainToInstance(ProductFilterDto, { categoryId: 9876 });
        const errors = await validate(dto);
        const catErr = errors.find((e) => e.property === 'categoryId');

        expect(catErr).toBeDefined();
        expect(catErr?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when categorySlug is not a string', async () => {
        const dto = plainToInstance(ProductFilterDto, {
          categorySlug: ['slug-item'],
        });
        const errors = await validate(dto);
        const slugErr = errors.find((e) => e.property === 'categorySlug');

        expect(slugErr).toBeDefined();
        expect(slugErr?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when sortBy is an invalid enum value', async () => {
        const dtoInvalidStr = plainToInstance(ProductFilterDto, {
          sortBy: 'not_a_valid_sort_option',
        });
        const errorsInvalidStr = await validate(dtoInvalidStr);
        const sortErrStr = errorsInvalidStr.find(
          (e) => e.property === 'sortBy',
        );

        expect(sortErrStr).toBeDefined();
        expect(sortErrStr?.constraints).toHaveProperty('isEnum');

        const dtoNumber = plainToInstance(ProductFilterDto, {
          sortBy: 12345,
        });
        const errorsNumber = await validate(dtoNumber);
        const sortErrNum = errorsNumber.find((e) => e.property === 'sortBy');

        expect(sortErrNum).toBeDefined();
        expect(sortErrNum?.constraints).toHaveProperty('isEnum');
      });

      it('should fail validation when minPrice is negative', async () => {
        const dto = plainToInstance(ProductFilterDto, { minPrice: -1 });
        const errors = await validate(dto);
        const priceErr = errors.find((e) => e.property === 'minPrice');

        expect(priceErr).toBeDefined();
        expect(priceErr?.constraints).toHaveProperty('min');
      });

      it('should fail validation when minPrice is a decimal/float', async () => {
        const dto = plainToInstance(ProductFilterDto, { minPrice: 49.99 });
        const errors = await validate(dto);
        const priceErr = errors.find((e) => e.property === 'minPrice');

        expect(priceErr).toBeDefined();
        expect(priceErr?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when minPrice is non-numeric string', async () => {
        const dto = plainToInstance(ProductFilterDto, {
          minPrice: 'invalid-price',
        });
        const errors = await validate(dto);
        const priceErr = errors.find((e) => e.property === 'minPrice');

        expect(priceErr).toBeDefined();
        expect(priceErr?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when maxPrice is negative', async () => {
        const dto = plainToInstance(ProductFilterDto, { maxPrice: -5 });
        const errors = await validate(dto);
        const priceErr = errors.find((e) => e.property === 'maxPrice');

        expect(priceErr).toBeDefined();
        expect(priceErr?.constraints).toHaveProperty('min');
      });

      it('should fail validation when maxPrice is a decimal/float', async () => {
        const dto = plainToInstance(ProductFilterDto, { maxPrice: 99.5 });
        const errors = await validate(dto);
        const priceErr = errors.find((e) => e.property === 'maxPrice');

        expect(priceErr).toBeDefined();
        expect(priceErr?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when maxPrice is non-numeric string', async () => {
        const dto = plainToInstance(ProductFilterDto, {
          maxPrice: 'invalid-price',
        });
        const errors = await validate(dto);
        const priceErr = errors.find((e) => e.property === 'maxPrice');

        expect(priceErr).toBeDefined();
        expect(priceErr?.constraints).toHaveProperty('isInt');
      });

      it('should fail validation when inherited page is less than 1', async () => {
        const dto = plainToInstance(ProductFilterDto, { page: 0 });
        const errors = await validate(dto);
        const pageErr = errors.find((e) => e.property === 'page');

        expect(pageErr).toBeDefined();
        expect(pageErr?.constraints).toHaveProperty('min');
      });

      it('should fail validation when inherited limit is less than 1 or greater than 100', async () => {
        const dtoLow = plainToInstance(ProductFilterDto, { limit: 0 });
        const errorsLow = await validate(dtoLow);
        const limitErrLow = errorsLow.find((e) => e.property === 'limit');

        expect(limitErrLow).toBeDefined();
        expect(limitErrLow?.constraints).toHaveProperty('min');

        const dtoHigh = plainToInstance(ProductFilterDto, { limit: 101 });
        const errorsHigh = await validate(dtoHigh);
        const limitErrHigh = errorsHigh.find((e) => e.property === 'limit');

        expect(limitErrHigh).toBeDefined();
        expect(limitErrHigh?.constraints).toHaveProperty('max');
      });
    });
  });
});
