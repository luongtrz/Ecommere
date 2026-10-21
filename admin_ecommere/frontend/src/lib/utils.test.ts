import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins class names and drops falsy values', () => {
    expect(cn('px-2', false, undefined, 'py-1')).toBe('px-2 py-1');
  });

  it('keeps the last conflicting Tailwind class', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
