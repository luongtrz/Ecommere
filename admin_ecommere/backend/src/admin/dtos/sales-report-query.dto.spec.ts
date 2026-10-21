import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SalesReportQueryDto } from './sales-report-query.dto';

describe('SalesReportQueryDto', () => {
  it('should instantiate with default groupBy equal to "day"', () => {
    const dto = new SalesReportQueryDto();
    expect(dto).toBeDefined();
    expect(dto.groupBy).toBe('day');
    expect(dto.from).toBeUndefined();
    expect(dto.to).toBeUndefined();
  });

  describe('valid scenarios', () => {
    it('should validate successfully with valid from and to and default groupBy', async () => {
      const dto = plainToInstance(SalesReportQueryDto, {
        from: '2026-01-01',
        to: '2026-01-31',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.from).toBe('2026-01-01');
      expect(dto.to).toBe('2026-01-31');
      expect(dto.groupBy).toBe('day');
    });

    it.each(['day', 'week', 'month'] as const)(
      'should validate successfully when groupBy is "%s"',
      async (groupBy) => {
        const dto = plainToInstance(SalesReportQueryDto, {
          from: '2026-01-01',
          to: '2026-01-31',
          groupBy,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.groupBy).toBe(groupBy);
      },
    );
  });

  describe('validation failure scenarios', () => {
    describe('from property', () => {
      it('should fail when from is undefined or empty', async () => {
        const dtoUndefined = plainToInstance(SalesReportQueryDto, {
          to: '2026-01-31',
        });
        const errorsUndefined = await validate(dtoUndefined);
        const errorUndef = errorsUndefined.find((e) => e.property === 'from');
        expect(errorUndef).toBeDefined();
        expect(errorUndef?.constraints?.isNotEmpty).toBe(
          'from không được để trống',
        );

        const dtoEmpty = plainToInstance(SalesReportQueryDto, {
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
          '2026-01-01T00:00:00.000Z',
          'invalid',
          '20260101',
          '26-01-01',
        ];

        for (const invalidDate of invalidDates) {
          const dto = plainToInstance(SalesReportQueryDto, {
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
        const dtoUndefined = plainToInstance(SalesReportQueryDto, {
          from: '2026-01-01',
        });
        const errorsUndefined = await validate(dtoUndefined);
        const errorUndef = errorsUndefined.find((e) => e.property === 'to');
        expect(errorUndef).toBeDefined();
        expect(errorUndef?.constraints?.isNotEmpty).toBe(
          'to không được để trống',
        );

        const dtoEmpty = plainToInstance(SalesReportQueryDto, {
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
          'invalid',
          '20260131',
        ];

        for (const invalidDate of invalidDates) {
          const dto = plainToInstance(SalesReportQueryDto, {
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

    describe('groupBy property', () => {
      it('should fail when groupBy is not one of day, week, month', async () => {
        const invalidValues = ['year', 'hour', 'quarter', 'daily', 'DAY', ''];

        for (const invalidValue of invalidValues) {
          const dto = plainToInstance(SalesReportQueryDto, {
            from: '2026-01-01',
            to: '2026-01-31',
            groupBy: invalidValue as any,
          });
          const errors = await validate(dto);
          const error = errors.find((e) => e.property === 'groupBy');
          expect(error).toBeDefined();
          expect(error?.constraints?.isIn).toBe(
            'groupBy phải là day, week hoặc month',
          );
        }
      });
    });
  });
});
