import { describe, expect, it } from 'vitest';
import * as AppModule from './App';

describe('App', () => {
  it('exports an empty module since routing is configured in router.tsx', () => {
    expect(AppModule).toBeDefined();
    expect(Object.keys(AppModule)).toHaveLength(0);
  });

  it('does not export a default component', () => {
    expect('default' in AppModule).toBe(false);
  });

  it('can be dynamically imported without throwing', async () => {
    const mod = await import('./App');
    expect(mod).toBeDefined();
    expect(Object.keys(mod)).toHaveLength(0);
  });
});
