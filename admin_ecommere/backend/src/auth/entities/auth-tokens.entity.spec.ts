import { AuthTokensEntity } from './auth-tokens.entity';

describe('AuthTokensEntity', () => {
  it('should be defined', () => {
    expect(AuthTokensEntity).toBeDefined();
  });

  describe('constructor', () => {
    it('should create an instance with all provided parameters', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      const expiresIn = '1h';

      const entity = new AuthTokensEntity(accessToken, refreshToken, expiresIn);

      expect(entity).toBeInstanceOf(AuthTokensEntity);
      expect(entity.accessToken).toBe(accessToken);
      expect(entity.refreshToken).toBe(refreshToken);
      expect(entity.expiresIn).toBe(expiresIn);
      expect(entity).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: '1h',
      });
    });

    it('should use default expiresIn ("15m") when expiresIn parameter is omitted', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      const entity = new AuthTokensEntity(accessToken, refreshToken);

      expect(entity).toBeInstanceOf(AuthTokensEntity);
      expect(entity.accessToken).toBe(accessToken);
      expect(entity.refreshToken).toBe(refreshToken);
      expect(entity.expiresIn).toBe('15m');
      expect(entity).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: '15m',
      });
    });

    it('should use default expiresIn ("15m") when expiresIn parameter is explicitly undefined', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      const entity = new AuthTokensEntity(accessToken, refreshToken, undefined);

      expect(entity).toBeInstanceOf(AuthTokensEntity);
      expect(entity.accessToken).toBe(accessToken);
      expect(entity.refreshToken).toBe(refreshToken);
      expect(entity.expiresIn).toBe('15m');
      expect(entity).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: '15m',
      });
    });

    it('should correctly assign empty strings or alternative values', () => {
      const entity = new AuthTokensEntity('', '', '');

      expect(entity.accessToken).toBe('');
      expect(entity.refreshToken).toBe('');
      expect(entity.expiresIn).toBe('');
      expect(entity).toEqual({
        accessToken: '',
        refreshToken: '',
        expiresIn: '',
      });
    });
  });
});
