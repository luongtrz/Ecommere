import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import apiClient, { authToken } from '@/lib/api';
import { useCartStore } from '@/features/cart/store/cartStore';
import { authApi, type LoginResponse, type User } from './auth.api';

const clearCartMock = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    decode: vi.fn(),
  },
}));

vi.mock('@/features/cart/store/cartStore', () => ({
  useCartStore: {
    getState: vi.fn(() => ({
      clearCart: clearCartMock,
    })),
    setState: vi.fn(),
  },
}));

let localStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string): string | null => localStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStore[key] = String(value);
  }),
  removeItem: vi.fn((key: string) => {
    delete localStore[key];
  }),
  clear: vi.fn(() => {
    localStore = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
vi.stubGlobal('localStorage', localStorageMock);

describe('authApi', () => {
  const mockedApiClient = vi.mocked(apiClient);
  const mockedAuthToken = vi.mocked(authToken);
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockAdminUser: User = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Quản Trị Viên',
    role: 'ADMIN',
    phone: '0987654321',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockLoginResponse: LoginResponse = {
    user: mockAdminUser,
    accessToken: 'admin-access-token-xyz',
    expiresIn: '86400s',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStore = {};
    useCartStore.setState({});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('login', () => {
    it('logs in successfully with backend response wrapping (.data.data), updates authToken, clearCart check and localStorage', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      const result = await authApi.login('0987654321', 'password123');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
        phone: '0987654321',
        password: 'password123',
      });
      expect(mockedAuthToken.set).toHaveBeenCalledWith(
        mockLoginResponse.accessToken,
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockLoginResponse.user),
      );
      expect(result).toEqual(mockLoginResponse);
    });

    it('logs in successfully with unwrapped response data (.data)', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: mockLoginResponse,
      });

      const result = await authApi.login('0987654321', 'password123');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
        phone: '0987654321',
        password: 'password123',
      });
      expect(mockedAuthToken.set).toHaveBeenCalledWith(
        mockLoginResponse.accessToken,
      );
      expect(result).toEqual(mockLoginResponse);
    });

    it('clears cart when previous user ID in localStorage does not match logging in user ID', async () => {
      localStore['user'] = JSON.stringify({ id: 'different-user-id' });
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      await authApi.login('0987654321', 'password123');

      expect(clearCartMock).toHaveBeenCalledTimes(1);
    });

    it('does not clear cart when previous user ID matches logging in user ID', async () => {
      localStore['user'] = JSON.stringify({ id: mockAdminUser.id });
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      await authApi.login('0987654321', 'password123');

      expect(clearCartMock).not.toHaveBeenCalled();
    });

    it('does not clear cart when there is no previous user in localStorage', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      await authApi.login('0987654321', 'password123');

      expect(clearCartMock).not.toHaveBeenCalled();
    });

    it('clears cart when previous user in localStorage has malformed JSON', async () => {
      localStore['user'] = '{invalid-json';
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      await authApi.login('0987654321', 'password123');

      expect(clearCartMock).toHaveBeenCalledTimes(1);
    });

    it('transforms null name to empty string in login response', async () => {
      const responseWithNullName = {
        ...mockLoginResponse,
        user: { ...mockAdminUser, name: null },
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: responseWithNullName },
      });

      const result = await authApi.login('0987654321', 'password123');

      expect(result.user.name).toBe('');
    });

    it('transforms undefined name to empty string in login response', async () => {
      const { name, ...userWithoutName } = mockAdminUser;
      const responseWithoutName = {
        ...mockLoginResponse,
        user: userWithoutName,
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: responseWithoutName },
      });

      const result = await authApi.login('0987654321', 'password123');

      expect(result.user.name).toBe('');
    });

    it('logs error and rethrows when login network request fails', async () => {
      const error = new Error('Network error');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.login('0987654321', 'password123')).rejects.toThrow(
        'Network error',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', error);
    });

    it('throws and logs when login response schema validation fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: { invalidPayload: true } },
      });

      await expect(
        authApi.login('0987654321', 'password123'),
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Login error:',
        expect.anything(),
      );
    });
  });

  describe('getProfile', () => {
    it('retrieves and parses user profile with wrapped response data (.data.data)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: mockAdminUser },
      });

      const result = await authApi.getProfile();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockAdminUser);
    });

    it('retrieves and parses user profile with unwrapped response data (.data)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockAdminUser,
      });

      const result = await authApi.getProfile();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockAdminUser);
    });

    it('transforms null name to empty string in getProfile response', async () => {
      const profileWithNullName = {
        ...mockAdminUser,
        name: null,
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: profileWithNullName },
      });

      const result = await authApi.getProfile();

      expect(result.name).toBe('');
    });

    it('throws when getProfile network request fails', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(authApi.getProfile()).rejects.toThrow('Unauthorized');
    });

    it('throws when getProfile response fails schema validation', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { id: 'admin-1', role: 'INVALID_ROLE' } },
      });

      await expect(authApi.getProfile()).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('logs out successfully and cleans up tokens, stores, and localStorage', async () => {
      localStore['user'] = JSON.stringify(mockAdminUser);
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { message: 'Đăng xuất thành công' },
      });

      await authApi.logout();

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockedAuthToken.remove).toHaveBeenCalledTimes(1);
      expect(clearCartMock).toHaveBeenCalledTimes(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('cleans up local state even when backend logout fails with error', async () => {
      localStore['user'] = JSON.stringify(mockAdminUser);
      const error = new Error('Logout network error');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.logout()).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', error);
      expect(mockedAuthToken.remove).toHaveBeenCalledTimes(1);
      expect(clearCartMock).toHaveBeenCalledTimes(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no user exists in localStorage', () => {
      expect(authApi.getCurrentUser()).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('user');
    });

    it('returns null when user in localStorage is empty string', () => {
      localStore['user'] = '';
      expect(authApi.getCurrentUser()).toBeNull();
    });

    it('returns null when user in localStorage is malformed JSON', () => {
      localStore['user'] = '{not-valid-json';
      expect(authApi.getCurrentUser()).toBeNull();
    });

    it('returns null when user in localStorage fails schema validation', () => {
      localStore['user'] = JSON.stringify({ id: 123, role: 'UNKNOWN_ROLE' });
      expect(authApi.getCurrentUser()).toBeNull();
    });

    it('returns parsed user when valid user JSON is stored in localStorage', () => {
      localStore['user'] = JSON.stringify(mockAdminUser);
      const user = authApi.getCurrentUser();
      expect(user).toEqual(mockAdminUser);
    });

    it('returns parsed user transforming null name to empty string', () => {
      const storedUser = {
        id: 'admin-99',
        email: 'admin99@example.com',
        name: null,
        role: 'ADMIN' as const,
        phone: '0909090909',
      };
      localStore['user'] = JSON.stringify(storedUser);
      const user = authApi.getCurrentUser();
      expect(user).toEqual({ ...storedUser, name: '' });
    });

    it('returns parsed user transforming undefined name to empty string', () => {
      const storedUser = {
        id: 'admin-98',
        email: 'admin98@example.com',
        role: 'ADMIN' as const,
        phone: '0909090908',
      };
      localStore['user'] = JSON.stringify(storedUser);
      const user = authApi.getCurrentUser();
      expect(user).toEqual({ ...storedUser, name: '' });
    });
  });
});
