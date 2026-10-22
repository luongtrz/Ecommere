import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { UpdateAddressDto } from './update-address.dto';

describe('UpdateAddressDto', () => {
  const getErrorForProperty = (
    errors: ValidationError[],
    property: string,
  ): ValidationError | undefined => {
    return errors.find((err) => err.property === property);
  };

  const transformAndValidate = async (
    plain: Record<string, unknown>,
  ): Promise<ValidationError[]> => {
    const dto = plainToInstance(UpdateAddressDto, plain);
    return validate(dto);
  };

  it('should instantiate an UpdateAddressDto instance directly with all properties', () => {
    const dto = new UpdateAddressDto();
    dto.fullName = 'Nguyễn Văn A';
    dto.phone = '0912345678';
    dto.province = 'Hồ Chí Minh';
    dto.district = 'Quận 1';
    dto.ward = 'Phường Bến Nghé';
    dto.line1 = '123 Đường Lê Lợi';
    dto.isDefault = true;

    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(UpdateAddressDto);
    expect(dto.fullName).toBe('Nguyễn Văn A');
    expect(dto.phone).toBe('0912345678');
    expect(dto.province).toBe('Hồ Chí Minh');
    expect(dto.district).toBe('Quận 1');
    expect(dto.ward).toBe('Phường Bến Nghé');
    expect(dto.line1).toBe('123 Đường Lê Lợi');
    expect(dto.isDefault).toBe(true);
  });

  describe('valid payloads', () => {
    it('should validate successfully when empty object is passed because all fields are optional', async () => {
      const errors = await transformAndValidate({});
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when all fields are valid', async () => {
      const validPayload = {
        fullName: 'Nguyễn Văn B',
        phone: '0987654321',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        line1: '456 Cầu Giấy',
        isDefault: false,
      };

      const errors = await transformAndValidate(validPayload);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with single-field partial updates', async () => {
      const fields: Array<[string, Record<string, unknown>]> = [
        ['fullName', { fullName: 'Trần Văn C' }],
        ['phone', { phone: '0901234567' }],
        ['province', { province: 'Đà Nẵng' }],
        ['district', { district: 'Hải Châu' }],
        ['ward', { ward: 'Thạch Thang' }],
        ['line1', { line1: '789 Bạch Đằng' }],
        ['isDefault true', { isDefault: true }],
        ['isDefault false', { isDefault: false }],
      ];

      for (const [, payload] of fields) {
        const errors = await transformAndValidate(payload);
        expect(errors).toHaveLength(0);
      }
    });

    it('should validate successfully when optional fields are null or undefined', async () => {
      const errors = await transformAndValidate({
        fullName: undefined,
        phone: null,
        province: undefined,
        district: null,
        ward: undefined,
        line1: null,
        isDefault: undefined,
      });

      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when setting valid properties directly on an instance', async () => {
      const dto = new UpdateAddressDto();
      dto.fullName = 'Lê Thị D';
      dto.phone = '0933333333';
      dto.isDefault = true;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('invalid payloads', () => {
    describe('fullName validation', () => {
      it.each([
        ['number', 12345],
        ['boolean', true],
        ['object', { name: 'test' }],
        ['array', ['test']],
      ])(
        'should fail when fullName is not a string: %s',
        async (_type, value) => {
          const errors = await transformAndValidate({ fullName: value });
          const error = getErrorForProperty(errors, 'fullName');

          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('isString');
        },
      );
    });

    describe('phone validation', () => {
      it.each([
        ['number', 912345678],
        ['boolean', false],
        ['object', { phone: '123' }],
        ['array', ['0912345678']],
      ])('should fail when phone is not a string: %s', async (_type, value) => {
        const errors = await transformAndValidate({ phone: value });
        const error = getErrorForProperty(errors, 'phone');

        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });
    });

    describe('province validation', () => {
      it.each([
        ['number', 100],
        ['boolean', true],
        ['object', {}],
      ])(
        'should fail when province is not a string: %s',
        async (_type, value) => {
          const errors = await transformAndValidate({ province: value });
          const error = getErrorForProperty(errors, 'province');

          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('isString');
        },
      );
    });

    describe('district validation', () => {
      it.each([
        ['number', 1],
        ['boolean', false],
        ['object', {}],
      ])(
        'should fail when district is not a string: %s',
        async (_type, value) => {
          const errors = await transformAndValidate({ district: value });
          const error = getErrorForProperty(errors, 'district');

          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('isString');
        },
      );
    });

    describe('ward validation', () => {
      it.each([
        ['number', 1],
        ['boolean', true],
        ['object', {}],
      ])('should fail when ward is not a string: %s', async (_type, value) => {
        const errors = await transformAndValidate({ ward: value });
        const error = getErrorForProperty(errors, 'ward');

        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });
    });

    describe('line1 validation', () => {
      it.each([
        ['number', 123],
        ['boolean', false],
        ['object', {}],
      ])('should fail when line1 is not a string: %s', async (_type, value) => {
        const errors = await transformAndValidate({ line1: value });
        const error = getErrorForProperty(errors, 'line1');

        expect(error).toBeDefined();
        expect(error?.constraints).toHaveProperty('isString');
      });
    });

    describe('isDefault validation', () => {
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
          const errors = await transformAndValidate({ isDefault: value });
          const error = getErrorForProperty(errors, 'isDefault');

          expect(error).toBeDefined();
          expect(error?.constraints).toHaveProperty('isBoolean');
        },
      );
    });

    describe('direct instance property mutation validation', () => {
      it('should fail validation when invalid properties are assigned directly to an instance', async () => {
        const dto = new UpdateAddressDto();
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
