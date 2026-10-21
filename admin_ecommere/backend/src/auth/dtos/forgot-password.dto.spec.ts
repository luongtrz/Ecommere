import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ForgotPasswordDto } from './forgot-password.dto';

describe('ForgotPasswordDto', () => {
  it('should be defined and instantiate with default properties', () => {
    const dto = new ForgotPasswordDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(ForgotPasswordDto);
    expect(dto.email).toBeUndefined();
  });

  describe('valid cases', () => {
    it('should validate successfully with a standard valid email', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {
        email: 'user@example.com',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with an email with subdomain', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {
        email: 'admin.user@mail.example.co.uk',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with plus-addressing in email', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {
        email: 'user+testing@example.com',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when properties are assigned directly on instance', async () => {
      const dto = new ForgotPasswordDto();
      dto.email = 'direct@example.com';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.email).toBe('direct@example.com');
    });
  });

  describe('validation failure cases', () => {
    it('should fail when email is undefined / missing', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email is null', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: null });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email is an empty string', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email has invalid format without @', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: 'notanemail' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email has missing domain', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: 'user@' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email has missing username', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: '@example.com' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email contains spaces', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {
        email: 'user @example.com',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email is a number', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: 12345 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email is a boolean', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: true });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email is an object', async () => {
      const dto = plainToInstance(ForgotPasswordDto, { email: {} });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });

    it('should fail when email is an array', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {
        email: ['user@example.com'],
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe('email must be an email');
    });
  });
});
