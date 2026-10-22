import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionRestore } from './useSessionRestore';
import apiClient, { authToken } from '@/lib/api';
import { useCartStore } from '@/features/cart/store/cartStore';

vi.mock('axios');

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
  apiClient: {
    post: vi.fn(),
  },
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    decode: vi.fn(),
  },
}));

describe('useSessionRestore', () => {
  let localStorageStore: Record<string, string> = {};
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    localStorageStore = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageStore[key] ?? null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        localStorageStore[key] = String(value);
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

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Reset Zustand store state before each test
    useCartStore.setState({
      items: [
        {
          productId: 'prod-admin-1',
          variantId: 'var-admin-1',
          name: 'Nước hoa Hoàng Gia',
          image: '/images/royal.png',
          price: 250000,
          quantity: 2,
          scent: 'Woody',
          volumeMl: 100,
        },
      ],
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('initially returns isRestoring as true and isAuthenticated as false while restore is pending', async () => {
    let resolvePost!: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePost = resolve;
    });
    localStorageStore['user'] = JSON.stringify({ id: 'user-init' });
    vi.mocked(apiClient.post).mockReturnValue(pendingPromise as any);

    const { result } = renderHook(() => useSessionRestore());

    expect(result.current.isRestoring).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);

    resolvePost({ data: { accessToken: 'token-done' } });
    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });
  });

  it('sets isRestoring to false and keeps isAuthenticated as false when user does not exist in localStorage', async () => {
    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(Storage.prototype.getItem).toHaveBeenCalledWith('user');
    expect(apiClient.post).not.toHaveBeenCalled();
    expect(authToken.set).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('sets isRestoring to false and keeps isAuthenticated as false when user in localStorage is empty string', async () => {
    localStorageStore['user'] = '';

    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(Storage.prototype.getItem).toHaveBeenCalledWith('user');
    expect(apiClient.post).not.toHaveBeenCalled();
    expect(authToken.set).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
  });

  it('successfully restores session when user exists and refresh returns nested data (data.data)', async () => {
    localStorageStore['user'] = JSON.stringify({
      id: 'admin-1',
      name: 'Quản trị viên',
      role: 'ADMIN',
    });

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'new-nested-access-token-xyz',
        },
      },
    });

    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
    expect(authToken.set).toHaveBeenCalledWith('new-nested-access-token-xyz');
    expect(result.current.isAuthenticated).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✅ Session restored successfully',
    );
    expect(Storage.prototype.removeItem).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
  });

  it('successfully restores session when user exists and refresh returns flat data without nested wrapper', async () => {
    localStorageStore['user'] = JSON.stringify({
      id: 'admin-2',
      name: 'Quản trị viên 2',
    });

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        accessToken: 'new-flat-access-token-abc',
      },
    });

    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
    expect(authToken.set).toHaveBeenCalledWith('new-flat-access-token-abc');
    expect(result.current.isAuthenticated).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✅ Session restored successfully',
    );
    expect(Storage.prototype.removeItem).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
  });

  it('handles refresh error: logs error message, removes token, clears cart, removes user from localStorage, and sets isAuthenticated to false', async () => {
    localStorageStore['user'] = JSON.stringify({
      id: 'admin-3',
      name: 'Expired Admin',
    });
    expect(useCartStore.getState().items.length).toBe(1);

    const clearCartSpy = vi.spyOn(useCartStore.getState(), 'clearCart');
    const refreshError = new Error('Phiên đăng nhập hết hạn (401)');
    vi.mocked(apiClient.post).mockRejectedValueOnce(refreshError);

    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '❌ Session expired, please login again',
    );
    expect(authToken.remove).toHaveBeenCalledTimes(1);
    expect(clearCartSpy).toHaveBeenCalledTimes(1);
    expect(useCartStore.getState().items).toEqual([]);
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    expect(localStorageStore['user']).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles refresh rejection with non-Error object gracefully', async () => {
    localStorageStore['user'] = JSON.stringify({ id: 'admin-4' });

    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Lỗi máy chủ nội bộ' } },
    });

    const { result } = renderHook(() => useSessionRestore());

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '❌ Session expired, please login again',
    );
    expect(authToken.remove).toHaveBeenCalledTimes(1);
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    expect(result.current.isAuthenticated).toBe(false);
  });
});
