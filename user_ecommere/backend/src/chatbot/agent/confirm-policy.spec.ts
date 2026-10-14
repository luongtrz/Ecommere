import { CONFIRM_POLICY_VERSION, requiresConfirmation } from './confirm-policy';

describe('confirm-policy', () => {
  it('rule 1: risk READ never confirms', () => {
    expect(CONFIRM_POLICY_VERSION).toBe(1);
    expect(requiresConfirmation({ app: 'USER', role: 'CUSTOMER', risk: 'READ' })).toBe(false);
    expect(requiresConfirmation({ app: 'USER', role: 'GUEST', risk: 'READ' })).toBe(false);
    expect(requiresConfirmation({ app: 'ADMIN', role: 'ADMIN', risk: 'READ' })).toBe(false);
    expect(requiresConfirmation({ app: 'ADMIN', role: 'CUSTOMER', risk: 'READ' })).toBe(false);
  });

  it('rule 2: app USER confirms SENSITIVE and DESTRUCTIVE, but not WRITE', () => {
    expect(requiresConfirmation({ app: 'USER', role: 'CUSTOMER', risk: 'WRITE' })).toBe(false);
    expect(requiresConfirmation({ app: 'USER', role: 'CUSTOMER', risk: 'SENSITIVE' })).toBe(true);
    expect(requiresConfirmation({ app: 'USER', role: 'CUSTOMER', risk: 'DESTRUCTIVE' })).toBe(true);
  });

  it('rule 3: app ADMIN confirms WRITE, SENSITIVE and DESTRUCTIVE', () => {
    expect(requiresConfirmation({ app: 'ADMIN', role: 'ADMIN', risk: 'WRITE' })).toBe(true);
    expect(requiresConfirmation({ app: 'ADMIN', role: 'ADMIN', risk: 'SENSITIVE' })).toBe(true);
    expect(requiresConfirmation({ app: 'ADMIN', role: 'ADMIN', risk: 'DESTRUCTIVE' })).toBe(true);
  });

  it('rule 4: role GUEST that reaches a non-read tool confirms (fail closed)', () => {
    expect(requiresConfirmation({ app: 'USER', role: 'GUEST', risk: 'WRITE' })).toBe(true);
    expect(requiresConfirmation({ app: 'USER', role: 'GUEST', risk: 'SENSITIVE' })).toBe(true);
    expect(requiresConfirmation({ app: 'USER', role: 'GUEST', risk: 'DESTRUCTIVE' })).toBe(true);
    expect(requiresConfirmation({ app: 'ADMIN', role: 'GUEST', risk: 'WRITE' })).toBe(true);
    expect(requiresConfirmation({ app: 'ADMIN', role: 'GUEST', risk: 'SENSITIVE' })).toBe(true);
    expect(requiresConfirmation({ app: 'ADMIN', role: 'GUEST', risk: 'DESTRUCTIVE' })).toBe(true);
  });

  it('rule 5: any unknown risk value confirms (fail closed)', () => {
    expect(requiresConfirmation({ app: 'USER', role: 'CUSTOMER', risk: 'UNKNOWN' as any })).toBe(true);
    expect(requiresConfirmation({ app: 'ADMIN', role: 'ADMIN', risk: 'INVALID' as any })).toBe(true);
    expect(requiresConfirmation({ app: 'USER', role: 'CUSTOMER', risk: '' as any })).toBe(true);
    expect(requiresConfirmation({ app: 'USER', role: 'CUSTOMER', risk: undefined as any })).toBe(true);
  });
});
