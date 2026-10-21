import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RefreshDto } from './refresh.dto';

describe('RefreshDto', () => {
  it('should be defined and instantiate with default properties', () => {
    const dto = new RefreshDto();
    expect(dto).toBeDefined();
    expect(dto).toBeInstanceOf(RefreshDto);
    expect(dto.refreshToken).toBeUndefined();
  });

  describe('valid cases', () => {
    it('should validate successfully with a valid refresh token string', async () => {
      const dto = plainToInstance(RefreshDto, {
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.validtokenpayload.signature',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with an empty string as IsString permits it', async () => {
      const dto = plainToInstance(RefreshDto, {
        refreshToken: '',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully with arbitrary string content', async () => {
      const dto = plainToInstance(RefreshDto, {
        refreshToken: 'custom-random-refresh-token-value-12345',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate successfully when properties are assigned directly on instance', async () => {
      const dto = new RefreshDto();
      dto.refreshToken = 'direct-assigned-token';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.refreshToken).toBe('direct-assigned-token');
    });
  });

  describe('validation failure cases', () => {
    it('should fail when refreshToken is undefined / missing', async () => {
      const dto = plainToInstance(RefreshDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isString');
      expect(errors[0].constraints?.isString).toBe(
        'refreshToken must be a string',
      );
    });

    it('should fail when refreshToken is null', async () => {
      const dto = plainToInstance(RefreshDto, { refreshToken: null });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isString');
      expect(errors[0].constraints?.isString).toBe(
        'refreshToken must be a string',
      );
    });

    it('should fail when refreshToken is a number', async () => {
      const dto = plainToInstance(RefreshDto, { refreshToken: 12345 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isString');
      expect(errors[0].constraints?.isString).toBe(
        'refreshToken must be a string',
      );
    });

    it('should fail when refreshToken is a boolean', async () => {
      const dto = plainToInstance(RefreshDto, { refreshToken: true });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isString');
      expect(errors[0].constraints?.isString).toBe(
        'refreshToken must be a string',
      );
    });

    it('should fail when refreshToken is an object', async () => {
      const dto = plainToInstance(RefreshDto, { refreshToken: {} });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isString');
      expect(errors[0].constraints?.isString).toBe(
        'refreshToken must be a string',
      );
    });

    it('should fail when refreshToken is an array', async () => {
      const dto = plainToInstance(RefreshDto, { refreshToken: ['token'] });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints).toHaveProperty('isString');
      expect(errors[0].constraints?.isString).toBe(
        'refreshToken must be a string',
      );
    });
  });
});
