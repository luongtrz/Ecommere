import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ResetPasswordDto } from './reset-password.dto';

describe('ResetPasswordDto', () => {
  const createValidDtoData = () => ({
    token: 'reset-token-here',
    newPassword: 'NewPassword@123',
  });

  const toDto = (plain: Record<string, any>): ResetPasswordDto => {
    return plainToInstance(ResetPasswordDto, plain);
  };

  it('should be defined and instantiate correctly', () => {
    const dto = new ResetPasswordDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(ResetPasswordDto);
  });

  describe('valid cases', () => {
    it('should validate successfully with valid token and newPassword', async () => {
      const dto = toDto(createValidDtoData());
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully when direct instantiation is used', async () => {
      const dto = new ResetPasswordDto();
      dto.token = 'reset-token-here';
      dto.newPassword = 'NewPassword@123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it.each([
      ['NewPassword@123', 'standard strong password'],
      ['NewP$ssword1', 'special character $'],
      ['NewP!ssword1', 'special character !'],
      ['NewP%ssword1', 'special character %'],
      ['NewP*ssword1', 'special character *'],
      ['NewP?ssword1', 'special character ?'],
      ['NewP&ssword1', 'special character &'],
      ['Pass@123', 'minimum length of 8 with all character classes'],
    ] as [string, string][])(
      'should accept valid newPassword format: %s (%s)',
      async (newPassword: string, _desc: string) => {
        const dto = toDto({
          ...createValidDtoData(),
          newPassword,
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      },
    );
  });

  describe('token validation failures', () => {
    it('should fail when token is missing or undefined', async () => {
      const dto = toDto({
        newPassword: 'NewPassword@123',
      });
      const errors = await validate(dto);
      const tokenError = errors.find((e) => e.property === 'token');
      expect(tokenError).toBeDefined();
      expect(tokenError?.constraints).toHaveProperty('isString');
    });

    it.each([
      [12345, 'number'],
      [true, 'boolean'],
      [{}, 'object'],
      [[], 'array'],
    ] as [any, string][])(
      'should fail when token is not a string: %p (%s)',
      async (token: any, _desc: string) => {
        const dto = toDto({
          ...createValidDtoData(),
          token,
        });
        const errors = await validate(dto);
        const tokenError = errors.find((e) => e.property === 'token');
        expect(tokenError).toBeDefined();
        expect(tokenError?.constraints).toHaveProperty('isString');
      },
    );
  });

  describe('newPassword validation failures', () => {
    it('should fail when newPassword is missing or undefined', async () => {
      const dto = toDto({
        token: 'reset-token-here',
      });
      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'newPassword');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('isString');
    });

    it('should fail when newPassword is not a string', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        newPassword: 12345678,
      });
      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'newPassword');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('isString');
    });

    it('should fail when newPassword length is less than 8 characters', async () => {
      const dto = toDto({
        ...createValidDtoData(),
        newPassword: 'Pass@1',
      });
      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'newPassword');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('minLength');
    });

    it.each([
      ['newpassword@123', 'missing uppercase'],
      ['NEWPASSWORD@123', 'missing lowercase'],
      ['NewPassword@abc', 'missing digit'],
      ['NewPassword1234', 'missing special character'],
    ] as [string, string][])(
      'should fail with custom message when newPassword lacks required character classes: %s (%s)',
      async (newPassword: string, _desc: string) => {
        const dto = toDto({
          ...createValidDtoData(),
          newPassword,
        });
        const errors = await validate(dto);
        const passwordError = errors.find((e) => e.property === 'newPassword');
        expect(passwordError).toBeDefined();
        expect(passwordError?.constraints?.matches).toBe(
          'Password must contain uppercase, lowercase, number and special character',
        );
      },
    );
  });
});
