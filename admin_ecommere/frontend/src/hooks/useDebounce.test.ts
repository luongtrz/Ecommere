import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('returns initial value immediately on first render', () => {
    const { result } = renderHook(() => useDebounce('initial'));
    expect(result.current).toBe('initial');
  });

  it('uses default delay of 500ms when delay parameter is omitted', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value),
      { initialProps: { value: 'initial' } },
    );

    rerender({ value: 'updated' });

    // Should not update before 500ms
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    // Should update at 500ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('debounces value changes with a custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'start', delay: 1000 } },
    );

    rerender({ value: 'changed', delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe('start');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('changed');
  });

  it('resets timer on rapid successive value updates and only applies the latest value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'v1', delay: 300 } },
    );

    // First change
    rerender({ value: 'v2', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('v1');

    // Second change resets timer
    rerender({ value: 'v3', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('v1');

    // Third change resets timer again
    rerender({ value: 'v4', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('v1');

    // Timer expires for v4
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('v4');
  });

  it('clears timeout on unmount before delay elapses', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { result, rerender, unmount } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'initial' } },
    );

    rerender({ value: 'pending' });
    expect(result.current).toBe('initial');

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });
    // Value remains unchanged after unmount
    expect(result.current).toBe('initial');

    clearTimeoutSpy.mockRestore();
  });

  it('adjusts timer when delay property changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    // Change delay to 200ms with a new value
    rerender({ value: 'fast', delay: 200 });

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('fast');
  });

  it('handles 0ms delay immediately after timer tick', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } },
    );

    rerender({ value: 'immediate', delay: 0 });

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe('immediate');
  });

  it('works with non-string types such as numbers, booleans, and objects', () => {
    const initialObj = { id: 1, active: true };
    const nextObj = { id: 2, active: false };

    const { result, rerender } = renderHook(
      ({ value }: { value: { id: number; active: boolean } }) =>
        useDebounce(value, 250),
      { initialProps: { value: initialObj } },
    );

    expect(result.current).toEqual({ id: 1, active: true });

    rerender({ value: nextObj });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current).toEqual({ id: 2, active: false });
    expect(result.current).toBe(nextObj);
  });

  it('handles array and null or undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string[] | null | undefined }) =>
        useDebounce(value, 100),
      { initialProps: { value: ['item1'] as string[] | null | undefined } },
    );

    expect(result.current).toEqual(['item1']);

    rerender({ value: null });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBeNull();

    rerender({ value: undefined });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBeUndefined();
  });

  it('maintains the same value when rerendered with identical value', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'same' } },
    );

    rerender({ value: 'same' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('same');
  });
});
