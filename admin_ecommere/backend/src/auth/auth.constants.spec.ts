import * as authConstants from './auth.constants';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER } from './auth.constants';

describe('Auth Constants', () => {
  describe('ADMIN_JWT_ISSUER', () => {
    it('should be defined and match the admin jwt issuer value', () => {
      expect(ADMIN_JWT_ISSUER).toBeDefined();
      expect(typeof ADMIN_JWT_ISSUER).toBe('string');
      expect(ADMIN_JWT_ISSUER).toBe('thai-spray-admin');
    });
  });

  describe('ADMIN_JWT_AUDIENCE', () => {
    it('should be defined and match the admin jwt audience value', () => {
      expect(ADMIN_JWT_AUDIENCE).toBeDefined();
      expect(typeof ADMIN_JWT_AUDIENCE).toBe('string');
      expect(ADMIN_JWT_AUDIENCE).toBe('thai-spray-admin');
    });
  });

  describe('exported constants shape', () => {
    it('should contain expected exports and values', () => {
      expect(authConstants).toEqual({
        ADMIN_JWT_ISSUER: 'thai-spray-admin',
        ADMIN_JWT_AUDIENCE: 'thai-spray-admin',
      });
      expect(Object.keys(authConstants)).toEqual(
        expect.arrayContaining(['ADMIN_JWT_ISSUER', 'ADMIN_JWT_AUDIENCE']),
      );
      expect(Object.keys(authConstants)).toHaveLength(2);
    });

    it('should maintain consistent issuer and audience tokens', () => {
      expect(ADMIN_JWT_ISSUER).toEqual(ADMIN_JWT_AUDIENCE);
    });
  });
});
