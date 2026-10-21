import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TopProductsQueryDto } from './top-products-query.dto';

describe('TopProductsQueryDto', () => {
  it('should instantiate with default limit equal to 5', () => {
    const dto = new TopProductsQueryDto();
    expect(dto).toBeDefined();
    expect(dto.limit).toBe(5);
    expect(dto.from).toBeUndefined();
    expect(dto.to).toBeUndefined();
  });

  describe('valid scenarios', () => {
    it('should validate successfully with valid from and to and default limit', async () => {
      const dto = plainToInstance(TopProductsQueryDto, {
        from: '2026-01-01',
        to: '2026-01-31',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.from).toBe('2026-01-01');
      expect(dto.to).toBe('2026-01-31');
      expect(dto.limit).toBe(5);
    });

    it('should validate successfully when explicit limit is provided within range', async () => {
      const dto = plainToInstance(TopProductsQueryDto, {
        from: '2026-02-01',
        to: '2026-02-28',
        limit: 10,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.limit).toBe(10);
    });

    it('should validate successfully with boundary limits (min: 1, max: 50)', async () => {
      const dtoMin = plainToInstance(TopProductsQueryDto, {
        from: '2026-01-01',
        to: '2026-01-31',
        limit: 1,
      });
      const errorsMin = await validate(dtoMin);
      expect(errorsMin).toHaveLength(0);
      expect(dtoMin.limit).toBe(1);

      const dtoMax = plainToInstance(TopProductsQueryDto, {
        from: '2026-01-01',
        to: '2026-01-31',
        limit: 50,
      });
      const errorsMax = await validate(dtoMax);
      expect(errorsMax).toHaveLength(0);
      expect(dtoMax.limit).toBe(50);
    });

    it('should transform numeric string limit to number', async () => {
      const dto = plainToInstance(TopProductsQueryDto, {
        from: '2026-01-01',
        to: '2026-01-31',
        limit: '25',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.limit).toBe(25);
      expect(typeof dto.limit).toBe('number');
    });
  });

  describe('validation failure scenarios', () => {
    describe('from property', () => {
      it('should fail when from is undefined or empty', async () => {
        const dtoUndefined = plainToInstance(TopProductsQueryDto, {
          to: '2026-01-31',
        });
        const errorsUndefined = await validate(dtoUndefined);
        const errorUndef = errorsUndefined.find((e) => e.property === 'from');
        expect(errorUndef).toBeDefined();
        expect(errorUndef?.constraints?.isNotEmpty).toBe(
          'from không được để trống',
        );

        const dtoEmpty = plainToInstance(TopProductsQueryDto, {
          from: '',
          to: '2026-01-31',
        });
        const errorsEmpty = await validate(dtoEmpty);
        const errorEmpty = errorsEmpty.find((e) => e.property === 'from');
        expect(errorEmpty).toBeDefined();
        expect(errorEmpty?.constraints?.isNotEmpty).toBe(
          'from không được để trống',
        );
      });

      it('should fail when from does not match YYYY-MM-DD pattern', async () => {
        const invalidDates = [
          '2026/01/01',
          '01-01-2026',
          '2026-1-1',
          '2026-01',
          '2026-01-01T00:00:00Z',
          'not-a-date',
          '20260101',
          '2026-01-1',
          '26-01-01',
        ];

        for (const invalidDate of invalidDates) {
          const dto = plainToInstance(TopProductsQueryDto, {
            from: invalidDate,
            to: '2026-01-31',
          });
          const errors = await validate(dto);
          const error = errors.find((e) => e.property === 'from');
          expect(error).toBeDefined();
          expect(error?.constraints?.matches).toBe(
            'from phải có định dạng YYYY-MM-DD',
          );
        }
      });
    });

    describe('to property', () => {
      it('should fail when to is undefined or empty', async () => {
        const dtoUndefined = plainToInstance(TopProductsQueryDto, {
          from: '2026-01-01',
        });
        const errorsUndefined = await validate(dtoUndefined);
        const errorUndef = errorsUndefined.find((e) => e.property === 'to');
        expect(errorUndef).toBeDefined();
        expect(errorUndef?.constraints?.isNotEmpty).toBe(
          'to không được để trống',
        );

        const dtoEmpty = plainToInstance(TopProductsQueryDto, {
          from: '2026-01-01',
          to: '',
        });
        const errorsEmpty = await validate(dtoEmpty);
        const errorEmpty = errorsEmpty.find((e) => e.property === 'to');
        expect(errorEmpty).toBeDefined();
        expect(errorEmpty?.constraints?.isNotEmpty).toBe(
          'to không được để trống',
        );
      });

      it('should fail when to does not match YYYY-MM-DD pattern', async () => {
        const invalidDates = [
          '2026/01/31',
          '31-01-2026',
          '2026-1-31',
          '2026-12',
          'invalid',
          '20260131',
        ];

        for (const invalidDate of invalidDates) {
          const dto = plainToInstance(TopProductsQueryDto, {
            from: '2026-01-01',
            to: invalidDate,
          });
          const errors = await validate(dto);
          const error = errors.find((e) => e.property === 'to');
          expect(error).toBeDefined();
          expect(error?.constraints?.matches).toBe(
            'to phải có định dạng YYYY-MM-DD',
          );
        }
      });
    });

    describe('limit property', () => {
      it('should fail when limit is less than 1', async () => {
        const dtoZero = plainToInstance(TopProductsQueryDto, {
          from: '2026-01-01',
          to: '2026-01-31',
          limit: 0,
        });
        const errorsZero = await validate(dtoZero);
        const errorZero = errorsZero.find((e) => e.property === 'limit');
        expect(errorZero).toBeDefined();
        expect(errorZero?.constraints?.min).toBe('limit tối thiểu là 1');

        const dtoNegative = plainToInstance(TopProductsQueryDto, {
          from: '2026-01-01',
          to: '2026-01-31',
          limit: -5,
        });
        const errorsNegative = await validate(dtoNegative);
        const errorNegative = errorsNegative.find((e) => e.property === 'limit');
        expect(errorNegative).toBeDefined();
        expect(errorNegative?.constraints?.min).toBe('limit tối thiểu là 1');
      });

      it('should fail when limit is greater than 50', async () => {
        const dtoExceed = plainToInstance(TopProductsQueryDto, {
          from: '2026-01-01',
          to: '2026-01-31',
          limit: 51,
        });
        const errorsExceed = await validate(dtoExceed);
        const errorExceed = errorsExceed.find((e) => e.property === 'limit');
        expect(errorExceed).toBeDefined();
        expect(errorExceed?.constraints?.max).toBe('limit tối đa là 50');

        const dtoLarge = plainToInstance(TopProductsQueryDto, {
          from: '2026-01-01',
          to: '2026-01-31',
          limit: 100,
        });
        const errorsLarge = await validate(dtoLarge);
        const errorLarge = errorsLarge.find((e) => e.property === 'limit');
        expect(errorLarge).toBeDefined();
        expect(errorLarge?.constraints?.max).toBe('limit tối đa là 50');
      });

      it('should fail when limit is not an integer', async () => {
        const dtoDecimal = plainToInstance(TopProductsQueryDto, {
          from: '2026-01-01',
          to: '2026-01-31',
          limit: 5.5,
        });
        const errorsDecimal = await validate(dtoDecimal);
        const errorDecimal = errorsDecimal.find((e) => e.property === 'limit');
        expect(errorDecimal).toBeDefined();
        expect(errorDecimal?.constraints?.isInt).toBe('limit phải là số nguyên');
      });

      it('should fail when limit cannot be parsed as an integer', async () => {
        const dtoFixedString = plainToInstance(TopProductsQueryDto, {
          from: '2026-01-01',
          to: '2026-01-31',
          limit: 'not-a-number',
        });
        const errorsString = await validate(dtoFixedString);
        const errorString = errorsString.find((e) => e.property === 'limit');
        expect(errorString).toBeDefined();
        expect(errorString?.constraints?.isInt).toBe('limit phải là số nguyên');
      });
    });
  });
});
