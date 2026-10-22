import { CONFIRM_POLICY_VERSION, requiresConfirmation } from './confirm-policy';

describe('confirm-policy - Coverage Companion', () => {
  it('confirms policy version constant is defined as 1', () => {
    expect(CONFIRM_POLICY_VERSION).toBe(1);
    expect(typeof CONFIRM_POLICY_VERSION).toBe('number');
  });

  describe('unrecognized app fallthrough (line 47)', () => {
    it('returns true when app is unrecognized and risk is WRITE, SENSITIVE, or DESTRUCTIVE for non-guest roles', () => {
      expect(
        requiresConfirmation({
          app: 'UNKNOWN_APP' as any,
          role: 'CUSTOMER',
          risk: 'WRITE',
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'PORTAL' as any,
          role: 'CUSTOMER',
          risk: 'SENSITIVE',
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'MOBILE_CLIENT' as any,
          role: 'ADMIN',
          risk: 'DESTRUCTIVE',
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: undefined as any,
          role: 'CUSTOMER',
          risk: 'WRITE',
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: '' as any,
          role: 'ADMIN',
          risk: 'SENSITIVE',
        }),
      ).toBe(true);
    });

    it('returns false for READ risk even when app is unrecognized', () => {
      expect(
        requiresConfirmation({
          app: 'UNKNOWN_APP' as any,
          role: 'CUSTOMER',
          risk: 'READ',
        }),
      ).toBe(false);

      expect(
        requiresConfirmation({
          app: undefined as any,
          role: 'ADMIN',
          risk: 'READ',
        }),
      ).toBe(false);
    });
  });

  describe('app USER with role ADMIN', () => {
    it('does not require confirmation for WRITE risk on app USER even when role is ADMIN', () => {
      expect(
        requiresConfirmation({
          app: 'USER',
          role: 'ADMIN',
          risk: 'WRITE',
        }),
      ).toBe(false);
    });

    it('requires confirmation for SENSITIVE and DESTRUCTIVE risks on app USER when role is ADMIN', () => {
      expect(
        requiresConfirmation({
          app: 'USER',
          role: 'ADMIN',
          risk: 'SENSITIVE',
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'USER',
          role: 'ADMIN',
          risk: 'DESTRUCTIVE',
        }),
      ).toBe(true);
    });
  });

  describe('app ADMIN with role CUSTOMER', () => {
    it('requires confirmation for WRITE, SENSITIVE, and DESTRUCTIVE risks on app ADMIN when role is CUSTOMER', () => {
      expect(
        requiresConfirmation({
          app: 'ADMIN',
          role: 'CUSTOMER',
          risk: 'WRITE',
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'ADMIN',
          role: 'CUSTOMER',
          risk: 'SENSITIVE',
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'ADMIN',
          role: 'CUSTOMER',
          risk: 'DESTRUCTIVE',
        }),
      ).toBe(true);
    });
  });

  describe('role GUEST with unrecognized app', () => {
    it('requires confirmation for any known non-read risk when role is GUEST regardless of app', () => {
      expect(
        requiresConfirmation({
          app: 'THIRD_PARTY' as any,
          role: 'GUEST',
          risk: 'WRITE',
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'THIRD_PARTY' as any,
          role: 'GUEST',
          risk: 'SENSITIVE',
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'THIRD_PARTY' as any,
          role: 'GUEST',
          risk: 'DESTRUCTIVE',
        }),
      ).toBe(true);
    });

    it('returns false for READ risk when role is GUEST and app is unrecognized', () => {
      expect(
        requiresConfirmation({
          app: 'THIRD_PARTY' as any,
          role: 'GUEST',
          risk: 'READ',
        }),
      ).toBe(false);
    });
  });

  describe('unrecognized risk values fail closed', () => {
    it('returns true when risk is null, boolean, number, or unexpected string', () => {
      expect(
        requiresConfirmation({
          app: 'ADMIN',
          role: 'ADMIN',
          risk: null as any,
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'USER',
          role: 'ADMIN',
          risk: 12345 as any,
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'ADMIN',
          role: 'CUSTOMER',
          risk: false as any,
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'USER',
          role: 'CUSTOMER',
          risk: 'UNSUPPORTED_RISK' as any,
        }),
      ).toBe(true);

      expect(
        requiresConfirmation({
          app: 'UNKNOWN_APP' as any,
          role: 'GUEST',
          risk: 'UNSUPPORTED_RISK' as any,
        }),
      ).toBe(true);
    });
  });
});
