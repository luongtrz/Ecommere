import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateAddressDto } from './create-address.dto';

describe('CreateAddressDto', () => {
  const getErrorForProperty = (
    errors: ValidationError[],
    property: string,
  ): ValidationError | undefined => {
    return errors.find((err) => err.property === property);
  };

  const transformAndValidate = async (
    plain: Record<string, unknown>,
  ): Promise<ValidationError[]> => {
    const dto = plainToInstance(CreateAddressDto, plain);
    return validate(dto);
  };

  const validBasePayload = {
    fullName: 'Nguyễn Văn A',
    phone: '0912345678',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    line1: '123 Đường Lê Lợi',
  };

  it('should instantiate the DTO directly with all properties', () => {
    const dto = new CreateAddressDto();
    dto.fullName = 'Nguyễn Văn A';
    dto.phone = '0912345678';
    dto.province = 'Hồ Chí Minh';
    dto.district = 'Quận 1';
    dto.ward = 'Phường Bến Nghé';
    dto.line1 = '123 Đường Lê Lợi';
    dto.isDefault = true;

    expect(dto).toBeInstanceOf(CreateAddressDto);
    expect(dto.fullName).toBe('Nguyễn Văn A');
    expect(dto.phone).toBe('0912345678');
    expect(dto.province).toBe('Hồ Chí Minh');
    expect(dto.district).toBe('Quận 1');
    expect(dto.ward).toBe('Phường Bến Nghé');
    expect(dto.line1).toBe('123 Đường Lê Lợi');
    expect(dto.isDefault).toBe(true);
  });

  describe('valid payloads', () => {
    it('should pass validation with all required fields (isDefault omitted)', async () => {
      const dto = plainToInstance(CreateAddressDto, validBasePayload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.fullName).toBe('Nguyễn Văn A');
      expect(dto.phone).toBe('0912345678');
      expect(dto.province).toBe('Hồ Chí Minh');
      expect(dto.district).toBe('Quận 1');
      expect(dto.ward).toBe('Phường Bến Nghé');
      expect(dto.line1).toBe('123 Đường Lê Lợi');
      expect(dto.isDefault).toBeUndefined();
    });

    it('should pass validation with isDefault set to true', async () => {
      const errors = await transformAndValidate({
        ...validBasePayload,
        isDefault: true,
      });

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with isDefault set to false', async () => {
      const errors = await transformAndValidate({
        ...validBasePayload,
        isDefault: false,
      });

      expect(errors).toHaveLength(0);
    });

    it('should pass validation when isDefault is undefined or null', async () => {
      const errorsUndefined = await transformAndValidate({
        ...validBasePayload,
        isDefault: undefined,
      });
      expect(errorsUndefined).toHaveLength(0);

      const errorsNull = await transformAndValidate({
        ...validBasePayload,
        isDefault: null,
      });
      expect(errorsNull).toHaveLength(0);
    });

    it('should pass validation when instantiated directly with valid properties', async () => {
      const dto = new CreateAddressDto();
      dto.fullName = 'Trần Văn C';
      dto.phone = '0987654321';
      dto.province = 'Hà Nội';
      dto.district = 'Cầu Giấy';
      dto.ward = 'Dịch Vọng';
      dto.line1 = '456 Cầu Giấy';
      dto.isDefault = false;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('invalid payloads', () => {
    describe('missing required fields', () => {
      it('should fail validation when empty object is passed', async () => {
        const errors = await transformAndValidate({});

        expect(errors.length).toBeGreaterThanOrEqual(6);
        expect(
          getErrorForProperty(errors, 'fullName')?.constraints,
        ).toHaveProperty('isString');
        expect(
          getErrorForProperty(errors, 'phone')?.constraints,
        ).toHaveProperty('isString');
        expect(
          getErrorForProperty(errors, 'province')?.constraints,
        ).toHaveProperty('isString');
        expect(
          getErrorForProperty(errors, 'district')?.constraints,
        ).toHaveProperty('isString');
        expect(getErrorForProperty(errors, 'ward')?.constraints).toHaveProperty(
          'isString',
        );
        expect(
          getErrorForProperty(errors, 'line1')?.constraints,
        ).toHaveProperty('isString');
      });

      it('should fail validation when fullName is missing', async () => {
        const { fullName: _, ...payload } = validBasePayload;
        const errors = await transformAndValidate(payload);

        const error = getErrorForProperty(errors, 'fullName');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when phone is missing', async () => {
        const { phone: _, ...payload } = validBasePayload;
        const errors = await transformAndValidate(payload);

        const error = getErrorForProperty(errors, 'phone');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when province is missing', async () => {
        const { province: _, ...payload } = validBasePayload;
        const errors = await transformAndValidate(payload);

        const error = getErrorForProperty(errors, 'province');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when district is missing', async () => {
        const { district: _, ...payload } = validBasePayload;
        const errors = await transformAndValidate(payload);

        const error = getErrorForProperty(errors, 'district');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when ward is missing', async () => {
        const { ward: _, ...payload } = validBasePayload;
        const errors = await transformAndValidate(payload);

        const error = getErrorForProperty(errors, 'ward');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });

      it('should fail validation when line1 is missing', async () => {
        const { line1: _, ...payload } = validBasePayload;
        const errors = await transformAndValidate(payload);

        const error = getErrorForProperty(errors, 'line1');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });
    });

    describe('type validation for string fields', () => {
      it.each([
        ['number', 12345],
        ['boolean', true],
        ['object', { name: 'test' }],
        ['array', ['test']],
      ])(
        'should fail when fullName is not a string: %s',
        async (_type, value) => {
          const errors = await transformAndValidate({
            ...validBasePayload,
            fullName: value,
          });

          const error = getErrorForProperty(errors, 'fullName');
          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('isString');
        },
      );

      it.each([
        ['number', 912345678],
        ['boolean', false],
        ['object', { phone: '123' }],
        ['array', ['0912345678']],
      ])('should fail when phone is not a string: %s', async (_type, value) => {
        const errors = await transformAndValidate({
          ...validBasePayload,
          phone: value,
        });

        const error = getErrorForProperty(errors, 'phone');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });

      it.each([
        ['number', 100],
        ['boolean', true],
        ['object', {}],
      ])(
        'should fail when province is not a string: %s',
        async (_type, value) => {
          const errors = await transformAndValidate({
            ...validBasePayload,
            province: value,
          });

          const error = getErrorForProperty(errors, 'province');
          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('isString');
        },
      );

      it.each([
        ['number', 1],
        ['boolean', false],
        ['object', {}],
      ])(
        'should fail when district is not a string: %s',
        async (_type, value) => {
          const errors = await transformAndValidate({
            ...validBasePayload,
            district: value,
          });

          const error = getErrorForProperty(errors, 'district');
          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('isString');
        },
      );

      it.each([
        ['number', 1],
        ['boolean', true],
        ['object', {}],
      ])('should fail when ward is not a string: %s', async (_type, value) => {
        const errors = await transformAndValidate({
          ...validBasePayload,
          ward: value,
        });

        const error = getErrorForProperty(errors, 'ward');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });

      it.each([
        ['number', 123],
        ['boolean', false],
        ['object', {}],
      ])('should fail when line1 is not a string: %s', async (_type, value) => {
        const errors = await transformAndValidate({
          ...validBasePayload,
          line1: value,
        });

        const error = getErrorForProperty(errors, 'line1');
        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });
    });

    describe('type validation for isDefault field', () => {
      it.each([
        ['string "true"', 'true'],
        ['string "false"', 'false'],
        ['number 1', 1],
        ['number 0', 0],
        ['object', { enabled: true }],
        ['array', [true]],
      ])(
        'should fail when isDefault is not a boolean: %s',
        async (_type, value) => {
          const errors = await transformAndValidate({
            ...validBasePayload,
            isDefault: value,
          });

          const error = getErrorForProperty(errors, 'isDefault');
          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('isBoolean');
        },
      );
    });

    describe('direct instance property mutation validation', () => {
      it('should fail validation when invalid properties are assigned directly to an instance', async () => {
        const dto = new CreateAddressDto();
        (dto as any).fullName = 12345;
        (dto as any).phone = true;
        (dto as any).province = {};
        (dto as any).district = [];
        (dto as any).ward = 999;
        (dto as any).line1 = false;
        (dto as any).isDefault = 'invalid-boolean';

        const errors = await validate(dto);
        expect(errors.length).toBe(7);
        expect(
          getErrorForProperty(errors, 'fullName')?.constraints,
        ).toHaveProperty('isString');
        expect(
          getErrorForProperty(errors, 'phone')?.constraints,
        ).toHaveProperty('isString');
        expect(
          getErrorForProperty(errors, 'province')?.constraints,
        ).toHaveProperty('isString');
        expect(
          getErrorForProperty(errors, 'district')?.constraints,
        ).toHaveProperty('isString');
        expect(getErrorForProperty(errors, 'ward')?.constraints).toHaveProperty(
          'isString',
        );
        expect(
          getErrorForProperty(errors, 'line1')?.constraints,
        ).toHaveProperty('isString');
        expect(
          getErrorForProperty(errors, 'isDefault')?.constraints,
        ).toHaveProperty('isBoolean');
      });
    });
  });
});
