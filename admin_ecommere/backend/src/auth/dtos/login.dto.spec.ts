import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  const createValidDtoData = () => ({
    phone: '0901234567',
    password: 'StrongPassword@123',
  });

  const toDto = (plain: Record<string, any>): LoginDto => {
    return plainToInstance(LoginDto, plain);
  };

  it('should be defined and instantiate correctly', () => {
    const dto = new LoginDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(LoginDto);
  });

  describe('valid cases', () => {
    it('should validate successfully with valid phone and password', async () => {
      const dto = toDto(createValidDtoData());
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully when direct instantiation is used', async () => {
      const dto = new LoginDto();
      dto.phone = '0901234567';
      dto.password = 'StrongPassword@123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it.each([
      ['0901234567', 'starts with 0 and 9 digits'],
      ['09012345678', 'starts with 0 and 10 digits'],
      ['+84901234567', 'starts with +84 and 9 digits'],
      ['+849012345678', 'starts with +84 and 10 digits'],
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
      ['123456', 'exactly 6 characters'],
      ['StrongPassword@123', 'long password with special chars'],
      ['abcdefgh', 'simple 8 character string'],
    ] as [string, string][])(
      'should accept password meeting minimum 6 characters: %s (%s)',
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

  describe('phone validation failures', () => {
    it('should fail when phone is missing or undefined', async () => {
      const dto = toDto({
        password: 'StrongPassword@123',
      });
      const errors = await validate(dto);
      const phoneError = errors.find((e) => e.property === 'phone');
      expect(phoneError).toBeDefined();
      expect(phoneError?.constraints).toHaveProperty('isString');
    });

    it('should fail when phone is not a string', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        phone: 901234567,
      });
      const errors = await validate(dto);
      const phoneError = errors.find((e) => e.property === 'phone');
      expect(phoneError).toBeDefined();
      expect(phoneError?.constraints).toHaveProperty('isString');
    });

    it.each([
      ['', 'empty string'],
      ['1234567890', 'does not start with 0 or +84'],
      ['09012345', 'too short (7 digits after 0)'],
      ['09012345678901', 'too long (11 digits after 0)'],
      ['+84901234', 'too short (+84 with 6 digits)'],
      ['+849012345678901', 'too long (+84 with 12 digits)'],
      ['09012345ab', 'contains alphabet characters'],
      ['09012-3456', 'contains dashes'],
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
        phone: '0901234567',
      });
      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('isString');
    });

    it('should fail when password is not a string', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        password: 123456,
      });
      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('isString');
    });

    it.each([
      ['', 'empty string'],
      ['12345', '5 characters (< 6)'],
      ['a', '1 character'],
    ] as [string, string][])(
      'should fail when password length is less than 6 characters: "%s" (%s)',
      async (password: string, _desc: string) => {
        const dto = toDto({
          ...createValidDtoData(),
          password,
        });
        const errors = await validate(dto);
        const passwordError = errors.find((e) => e.property === 'password');
        expect(passwordError).toBeDefined();
        expect(passwordError?.constraints).toHaveProperty('minLength');
      },
    );
  });
});
