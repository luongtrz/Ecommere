import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  describe('transform email', () => {
    it('transforms empty string email to undefined (branch: value === "")', () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Password@123',
        email: '',
      });

      expect(dto.email).toBeUndefined();
    });

    it('retains non-empty email string (branch: value !== "")', () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Password@123',
        email: 'user@example.com',
      });

      expect(dto.email).toBe('user@example.com');
    });

    it('keeps undefined when email is not provided', () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Password@123',
      });

      expect(dto.email).toBeUndefined();
    });

    it('keeps null when email is null', () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Password@123',
        email: null,
      });

      expect(dto.email).toBeNull();
    });
  });

  describe('validation', () => {
    it('passes validation with all valid required and optional fields', async () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Password@123',
        name: 'Nguyen Van A',
        email: 'user@example.com',
        referralCode: 'REF-ABC123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes validation with +84 country code phone format', async () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '+84912345678',
        password: 'Password@123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes validation when email is empty string because transform converts it to undefined', async () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Password@123',
        email: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.email).toBeUndefined();
    });

    it('fails validation when phone format is invalid', async () => {
      const invalidPhones = [
        '123456789',
        '09123456',
        '09123456789012',
        'abc09123456',
        '+1912345678',
      ];

      for (const phone of invalidPhones) {
        const dto = plainToInstance(RegisterDto, {
          phone,
          password: 'Password@123',
        });

        const errors = await validate(dto);
        const phoneError = errors.find((e) => e.property === 'phone');
        expect(phoneError).toBeDefined();
        expect(phoneError?.constraints?.matches).toBe(
          'Số điện thoại không hợp lệ',
        );
      }
    });

    it('fails validation when phone is missing or not a string', async () => {
      const dto = plainToInstance(RegisterDto, {
        password: 'Password@123',
      });

      const errors = await validate(dto);
      const phoneError = errors.find((e) => e.property === 'phone');
      expect(phoneError).toBeDefined();
      expect(phoneError?.constraints).toHaveProperty('isString');
    });

    it('fails validation when password is shorter than 8 characters', async () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Pass@1',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('minLength');
    });

    it('fails validation when password does not meet complexity requirements', async () => {
      const invalidPasswords = [
        'password@123', // missing uppercase
        'PASSWORD@123', // missing lowercase
        'Password@@@@', // missing digit
        'Password1234', // missing special char
      ];

      for (const password of invalidPasswords) {
        const dto = plainToInstance(RegisterDto, {
          phone: '0912345678',
          password,
        });

        const errors = await validate(dto);
        const passwordError = errors.find((e) => e.property === 'password');
        expect(passwordError).toBeDefined();
        expect(passwordError?.constraints?.matches).toBe(
          'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
        );
      }
    });

    it('fails validation when password is missing or not a string', async () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('isString');
    });

    it('fails validation when email is not a valid email address', async () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Password@123',
        email: 'invalid-email-format',
      });

      const errors = await validate(dto);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.constraints).toHaveProperty('isEmail');
    });

    it('fails validation when name is not a string', async () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Password@123',
        name: 12345 as any,
      });

      const errors = await validate(dto);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isString');
    });

    it('fails validation when referralCode is not a string', async () => {
      const dto = plainToInstance(RegisterDto, {
        phone: '0912345678',
        password: 'Password@123',
        referralCode: 99999 as any,
      });

      const errors = await validate(dto);
      const refError = errors.find((e) => e.property === 'referralCode');
      expect(refError).toBeDefined();
      expect(refError?.constraints).toHaveProperty('isString');
    });
  });
});
