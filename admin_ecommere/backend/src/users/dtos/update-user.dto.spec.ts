import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  const getErrorForProperty = (
    errors: ValidationError[],
    property: string,
  ): ValidationError | undefined => {
    return errors.find((err) => err.property === property);
  };

  const transformAndValidate = async (
    plain: Record<string, unknown>,
  ): Promise<ValidationError[]> => {
    const dto = plainToInstance(UpdateUserDto, plain);
    return validate(dto);
  };

  it('should instantiate the DTO directly with all properties', () => {
    const dto = new UpdateUserDto();
    dto.name = 'Nguyễn Văn A';
    dto.phone = '0912345678';

    expect(dto).toBeInstanceOf(UpdateUserDto);
    expect(dto.name).toBe('Nguyễn Văn A');
    expect(dto.phone).toBe('0912345678');
  });

  describe('valid payloads', () => {
    it('should pass validation when all fields are omitted (empty object)', async () => {
      const dto = plainToInstance(UpdateUserDto, {});
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBeUndefined();
      expect(dto.phone).toBeUndefined();
    });

    it('should pass validation when only name is provided', async () => {
      const dto = plainToInstance(UpdateUserDto, { name: 'Nguyễn Văn B' });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('Nguyễn Văn B');
      expect(dto.phone).toBeUndefined();
    });

    it.each([
      ['10-digit number starting with 0', '0912345678'],
      ['11-digit number starting with 0', '01234567890'],
      ['12-character format starting with +84 (9 digits)', '+84912345678'],
      ['13-character format starting with +84 (10 digits)', '+841234567890'],
    ])('should pass validation with valid phone: %s', async (_desc, phone) => {
      const dto = plainToInstance(UpdateUserDto, { phone });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.phone).toBe(phone);
    });

    it('should pass validation when both name and valid phone are provided', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        name: 'Trần Thị C',
        phone: '+84987654321',
      });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.name).toBe('Trần Thị C');
      expect(dto.phone).toBe('+84987654321');
    });

    it('should pass validation when optional fields are null or undefined', async () => {
      const errorsUndefined = await transformAndValidate({
        name: undefined,
        phone: undefined,
      });
      expect(errorsUndefined).toHaveLength(0);

      const errorsNull = await transformAndValidate({
        name: null,
        phone: null,
      });
      expect(errorsNull).toHaveLength(0);
    });

    it('should pass validation when instantiated directly with valid properties', async () => {
      const dto = new UpdateUserDto();
      dto.name = 'Lê Văn D';
      dto.phone = '0901234567';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('invalid payloads', () => {
    describe('name validation', () => {
      it.each([
        ['number', 12345],
        ['boolean', true],
        ['object', { key: 'value' }],
        ['array', ['user']],
      ])('should fail when name is not a string: %s', async (_type, value) => {
        const errors = await transformAndValidate({ name: value });

        const error = getErrorForProperty(errors, 'name');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });
    });

    describe('phone validation', () => {
      it.each([
        ['number', 912345678],
        ['boolean', false],
        ['object', { phone: '0912345678' }],
        ['array', ['0912345678']],
      ])('should fail when phone is not a string: %s', async (_type, value) => {
        const errors = await transformAndValidate({ phone: value });

        const error = getErrorForProperty(errors, 'phone');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });

      it.each([
        ['starts without 0 or +84', '1234567890'],
        [
          'starts with 0 but only 8 digits follow (9 digits total)',
          '091234567',
        ],
        [
          'starts with 0 but 11 digits follow (12 digits total)',
          '0912345678901',
        ],
        ['starts with +84 but only 8 digits follow', '+8491234567'],
        ['starts with +84 but 11 digits follow', '+84912345678901'],
        ['starts with wrong country code (+85)', '+85912345678'],
        ['contains letters', '091234567a'],
        ['contains dashes', '091-234-5678'],
        ['contains spaces', '0912 345 678'],
        ['empty string', ''],
        ['prefix only', '+84'],
      ])(
        'should fail with custom error message when phone format is invalid: %s',
        async (_desc, invalidPhone) => {
          const errors = await transformAndValidate({ phone: invalidPhone });

          const error = getErrorForProperty(errors, 'phone');
          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('matches');
          expect(error?.constraints?.matches).toBe(
            'Số điện thoại không hợp lệ',
          );
        },
      );
    });

    describe('multiple invalid fields', () => {
      it('should return errors for both name and phone when both are invalid', async () => {
        const errors = await transformAndValidate({
          name: 99999,
          phone: 'invalid-phone',
        });

        expect(errors).toHaveLength(2);
        expect(getErrorForProperty(errors, 'name')?.constraints).toHaveProperty(
          'isString',
        );
        expect(
          getErrorForProperty(errors, 'phone')?.constraints,
        ).toHaveProperty('matches');
        expect(getErrorForProperty(errors, 'phone')?.constraints?.matches).toBe(
          'Số điện thoại không hợp lệ',
        );
      });
    });

    describe('direct instance property mutation validation', () => {
      it('should fail validation when invalid values are set directly on an instance', async () => {
        const dto = new UpdateUserDto();
        (dto as any).name = 123;
        (dto as any).phone = 'not-a-valid-phone';

        const errors = await validate(dto);
        expect(errors.length).toBe(2);
        expect(getErrorForProperty(errors, 'name')?.constraints).toHaveProperty(
          'isString',
        );
        expect(
          getErrorForProperty(errors, 'phone')?.constraints,
        ).toHaveProperty('matches');
        expect(getErrorForProperty(errors, 'phone')?.constraints?.matches).toBe(
          'Số điện thoại không hợp lệ',
        );
      });
    });
  });
});
