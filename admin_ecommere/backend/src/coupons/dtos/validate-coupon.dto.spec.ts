import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidateCouponDto } from './validate-coupon.dto';

describe('ValidateCouponDto', () => {
  it('should instantiate the DTO directly', () => {
    const dto = new ValidateCouponDto();
    dto.code = 'SUMMER2025';

    expect(dto).toBeInstanceOf(ValidateCouponDto);
    expect(dto.code).toBe('SUMMER2025');
  });

  describe('validation - success scenarios', () => {
    it.each([
      'SUMMER2025',
      'WINTER_2026-VIP',
      'PROMO 2025',
      '',
      '   leading-trailing-spaces   ',
    ])(
      'should pass validation when code is a valid string: "%s"',
      async (code) => {
        const dto = plainToInstance(ValidateCouponDto, { code });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.code).toBe(code);
      },
    );
  });

  describe('validation - failure scenarios', () => {
    it('should fail validation when code is missing / undefined', async () => {
      const dto = plainToInstance(ValidateCouponDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const codeError = errors.find((e) => e.property === 'code');
      expect(codeError).toBeDefined();
      expect(codeError?.constraints).toHaveProperty('isString');
    });

    it('should fail validation when code is null', async () => {
      const dto = plainToInstance(ValidateCouponDto, { code: null });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const codeError = errors.find((e) => e.property === 'code');
      expect(codeError).toBeDefined();
      expect(codeError?.constraints).toHaveProperty('isString');
    });

    it.each([
      ['number', 12345],
      ['boolean true', true],
      ['boolean false', false],
      ['object', { coupon: 'SUMMER2025' }],
      ['array', ['SUMMER2025']],
    ])(
      'should fail validation when code is not a string: %s',
      async (_desc, invalidCode) => {
        const dto = plainToInstance(ValidateCouponDto, { code: invalidCode });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const codeError = errors.find((e) => e.property === 'code');
        expect(codeError).toBeDefined();
        expect(codeError?.constraints).toHaveProperty('isString');
      },
    );
  });
});
