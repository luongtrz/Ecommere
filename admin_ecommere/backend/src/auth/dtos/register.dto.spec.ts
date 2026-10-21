import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  const createValidDtoData = () => ({
    phone: '0912345678',
    password: 'Password@123',
    name: 'Nguyễn Văn A',
    email: 'user@example.com',
  });

  const toDto = (plain: Record<string, any>): RegisterDto => {
    return plainToInstance(RegisterDto, plain);
  };

  it('should be defined and instantiate correctly', () => {
    const dto = new RegisterDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(RegisterDto);
  });

  describe('valid cases', () => {
    it('should validate successfully when all fields are valid', async () => {
      const dto = toDto(createValidDtoData());
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully when optional fields name and email are omitted', async () => {
      const dto = toDto({
        phone: '0912345678',
        password: 'Password@123',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully when direct instantiation is used with valid properties', async () => {
      const dto = new RegisterDto();
      dto.phone = '0912345678';
      dto.password = 'Password@123';
      dto.name = 'Nguyễn Văn A';
      dto.email = 'user@example.com';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it.each([
      ['0912345678', 'starts with 0 and 9 digits'],
      ['09123456789', 'starts with 0 and 10 digits'],
      ['+84912345678', 'starts with +84 and 9 digits'],
      ['+849123456789', 'starts with +84 and 10 digits'],
    ] as [string, string][])(
      'should accept valid phone format: %s (%s)',
      async (phone: string, _desc: string) => {
        const dto = toDto({
          ...createValidDtoData(),
          phone,
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      },
    );

    it.each([
      ['Password@123', 'standard strong password'],
      ['P$ssword1', 'special character $'],
      ['P!ssword1', 'special character !'],
      ['P%ssword1', 'special character %'],
      ['P*ssword1', 'special character *'],
      ['P?ssword1', 'special character ?'],
      ['P&ssword1', 'special character &'],
    ] as [string, string][])(
      'should accept valid password format: %s (%s)',
      async (password: string, _desc: string) => {
        const dto = toDto({
          ...createValidDtoData(),
          password,
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      },
    );
  });

  describe('email transform and validation', () => {
    it('should transform empty string email to undefined and pass validation', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        email: '',
      });
      expect(dto.email).toBeUndefined();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should keep non-empty valid email unchanged and pass validation', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        email: 'test@domain.com',
      });
      expect(dto.email).toBe('test@domain.com');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when email is not a valid email address', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        email: 'invalid-email',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.constraints).toHaveProperty('isEmail');
    });
  });

  describe('phone validation failures', () => {
    it('should fail when phone is missing or undefined', async () => {
      const dto = toDto({
        password: 'Password@123',
      });
      const errors = await validate(dto);
      const phoneError = errors.find((e) => e.property === 'phone');
      expect(phoneError).toBeDefined();
      expect(phoneError?.constraints).toHaveProperty('isString');
    });

    it('should fail when phone is not a string', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        phone: 912345678,
      });
      const errors = await validate(dto);
      const phoneError = errors.find((e) => e.property === 'phone');
      expect(phoneError).toBeDefined();
      expect(phoneError?.constraints).toHaveProperty('isString');
    });

    it.each([
      ['', 'empty string'],
      ['1234567890', 'does not start with 0 or +84'],
      ['09123456', 'too short (7 digits after 0)'],
      ['0912345678901', 'too long (11 digits after 0)'],
      ['+84912345', 'too short (+84 with 6 digits)'],
      ['+84912345678901', 'too long (+84 with 12 digits)'],
      ['091234567a', 'contains alphabet characters'],
      ['09123-4567', 'contains dashes'],
    ] as [string, string][])(
      'should fail with custom message when phone is invalid: %s (%s)',
      async (phone: string, _desc: string) => {
        const dto = toDto({
          ...createValidDtoData(),
          phone,
        });
        const errors = await validate(dto);
        const phoneError = errors.find((e) => e.property === 'phone');
        expect(phoneError).toBeDefined();
        expect(phoneError?.constraints?.matches).toBe(
          'Số điện thoại không hợp lệ',
        );
      },
    );
  });

  describe('password validation failures', () => {
    it('should fail when password is missing or undefined', async () => {
      const dto = toDto({
        phone: '0912345678',
      });
      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('isString');
    });

    it('should fail when password is not a string', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        password: 12345678,
      });
      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('isString');
    });

    it('should fail when password is shorter than 8 characters', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        password: 'Pass@1',
      });
      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('minLength');
    });

    it.each([
      ['password@123', 'missing uppercase'],
      ['PASSWORD@123', 'missing lowercase'],
      ['Password@abc', 'missing digit'],
      ['Password1234', 'missing special character'],
    ] as [string, string][])(
      'should fail with custom message when password lacks required character classes: %s (%s)',
      async (password: string, _desc: string) => {
        const dto = toDto({
          ...createValidDtoData(),
          password,
        });
        const errors = await validate(dto);
        const passwordError = errors.find((e) => e.property === 'password');
        expect(passwordError).toBeDefined();
        expect(passwordError?.constraints?.matches).toBe(
          'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
        );
      },
    );
  });

  describe('name validation failures', () => {
    it('should fail when name is not a string', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        name: 12345,
      });
      const errors = await validate(dto);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isString');
    });
  });
});
