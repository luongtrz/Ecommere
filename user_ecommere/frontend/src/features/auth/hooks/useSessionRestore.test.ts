import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionRestore } from './useSessionRestore';
import apiClient, { authToken } from '@/lib/api';
import { useCartStore } from '@/features/cart/store/cartStore';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('useSessionRestore', () => {
  let localStorageStore: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();

    localStorageStore = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageStore[key] ?? null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        localStorageStore[key] = value;
      },
    );
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key: string) => {
        delete localStorageStore[key];
      },
    );
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      localStorageStore = {};
    });

    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Reset Zustand store state before each test
    useCartStore.setState({
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          name: 'Spray Rose',
          image: '/images/rose.png',
          price: 150000,
          quantity: 2,
          scent: 'Rose',
          volumeMl: 100,
        },
      ],
      isOpen: false,
    });
  });

  it('stops restoring and leaves isAuthenticated as false when no user is in localStorage', async () => {
    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(Storage.prototype.getItem).toHaveBeenCalledWith('user');
    expect(apiClient.post).not.toHaveBeenCalled();
    expect(authToken.set).not.toHaveBeenCalled();
  });

  it('restores session when user exists and refresh returns nested data (data.data)', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'user-1', name: 'Tester' }),
    );

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'new-nested-access-token',
        },
      },
    });

    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
    expect(authToken.set).toHaveBeenCalledWith('new-nested-access-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(console.log).toHaveBeenCalledWith(
      '✅ Session restored successfully',
    );
    expect(Storage.prototype.removeItem).not.toHaveBeenCalled();
  });

  it('restores session when user exists and refresh returns direct data without nested data wrapper', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'user-2', name: 'Direct' }),
    );

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        accessToken: 'new-direct-access-token',
      },
    });

    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
    expect(authToken.set).toHaveBeenCalledWith('new-direct-access-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(console.log).toHaveBeenCalledWith(
      '✅ Session restored successfully',
    );
  });

  it('handles refresh error by removing token, clearing cart, removing user from localStorage, and resetting state', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'user-3', name: 'Expired' }),
    );
    expect(useCartStore.getState().items.length).toBe(1);

    const refreshError = new Error('Session expired 401');
    vi.mocked(apiClient.post).mockRejectedValueOnce(refreshError);

    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
    expect(console.log).toHaveBeenCalledWith(
      '❌ Session expired, please login again',
    );
    expect(authToken.remove).toHaveBeenCalledTimes(1);
    expect(useCartStore.getState().items).toEqual([]);
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    expect(localStorage.getItem('user')).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
