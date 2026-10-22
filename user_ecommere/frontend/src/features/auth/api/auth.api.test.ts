import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import apiClient, { authToken } from '@/lib/api';
import { useCartStore } from '@/features/cart/store/cartStore';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';
import { authApi, type LoginResponse, type User } from './auth.api';

const clearCartMock = vi.fn();
const clearWishlistMock = vi.fn();

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

vi.mock('@/features/catalog/hooks/useWishlist', () => ({
  useWishlist: {
    getState: vi.fn(() => ({
      clearWishlist: clearWishlistMock,
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

  const mockUser: User = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Nguyen Van A',
    role: 'CUSTOMER',
    phone: '0987654321',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockLoginResponse: LoginResponse = {
    user: mockUser,
    accessToken: 'mock-access-token-xyz',
    expiresIn: '3600s',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStore = {};
    useCartStore.setState({});
    useWishlist.setState({});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('login', () => {
    it('logs in successfully with backend response wrapping (.data.data) and updates token and localStorage', async () => {
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
      localStore['user'] = JSON.stringify({ id: mockUser.id });
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
      localStore['user'] = '{malformed-json';
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      await authApi.login('0987654321', 'password123');

      expect(clearCartMock).toHaveBeenCalledTimes(1);
    });

    it('transforms null name to empty string in login response', async () => {
      const responseWithNullName = {
        ...mockLoginResponse,
        user: { ...mockUser, name: null },
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: responseWithNullName },
      });

      const result = await authApi.login('0987654321', 'password123');

      expect(result.user.name).toBe('');
    });

    it('logs error with status and message when login request fails with response error message', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Sai số điện thoại hoặc mật khẩu' },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.login('0987654321', 'wrongpass')).rejects.toEqual(
        error,
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', {
        status: 401,
        message: 'Sai số điện thoại hoặc mật khẩu',
      });
    });

    it('logs error with undefined message when response message is not a string', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: ['array error'] },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.login('0987654321', 'pass')).rejects.toEqual(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', {
        status: 500,
        message: undefined,
      });
    });

    it('logs error with undefined status and message when error has no response', async () => {
      const error = new Error('Network failure');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.login('0987654321', 'pass')).rejects.toThrow(
        'Network failure',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', {
        status: undefined,
        message: undefined,
      });
    });

    it('throws and logs when login response schema validation fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: { invalid: true } },
      });

      await expect(authApi.login('0987654321', 'pass')).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', {
        status: undefined,
        message: undefined,
      });
    });
  });

  describe('register', () => {
    it('registers successfully with all fields (name, phone, password, email, referralCode)', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      const result = await authApi.register(
        'Nguyen Van A',
        '0987654321',
        'password123',
        'a@example.com',
        'REF123',
      );

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Nguyen Van A',
        phone: '0987654321',
        password: 'password123',
        email: 'a@example.com',
        referralCode: 'REF123',
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

    it('registers successfully without optional email and referralCode', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: mockLoginResponse,
      });

      const result = await authApi.register(
        'Nguyen Van A',
        '0987654321',
        'password123',
      );

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Nguyen Van A',
        phone: '0987654321',
        password: 'password123',
      });
      expect(result).toEqual(mockLoginResponse);
    });

    it('registers with email only', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      await authApi.register(
        'Nguyen Van A',
        '0987654321',
        'password123',
        'a@example.com',
      );

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Nguyen Van A',
        phone: '0987654321',
        password: 'password123',
        email: 'a@example.com',
      });
    });

    it('registers with referralCode only', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      await authApi.register(
        'Nguyen Van A',
        '0987654321',
        'password123',
        undefined,
        'REF999',
      );

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Nguyen Van A',
        phone: '0987654321',
        password: 'password123',
        referralCode: 'REF999',
      });
    });

    it('clears cart when register switches to a different user account', async () => {
      localStore['user'] = JSON.stringify({ id: 'old-acc' });
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      await authApi.register('Nguyen Van A', '0987654321', 'password123');

      expect(clearCartMock).toHaveBeenCalledTimes(1);
    });

    it('does not clear cart when register keeps the same account id', async () => {
      localStore['user'] = JSON.stringify({ id: mockUser.id });
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: mockLoginResponse },
      });

      await authApi.register('Nguyen Van A', '0987654321', 'password123');

      expect(clearCartMock).not.toHaveBeenCalled();
    });

    it('logs error and rethrows when registration fails with response message string', async () => {
      const error = {
        response: {
          status: 409,
          data: { message: 'Số điện thoại đã tồn tại' },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.register('A', '098', 'p')).rejects.toEqual(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Register error:', {
        status: 409,
        message: 'Số điện thoại đã tồn tại',
      });
    });

    it('logs error with undefined message when response data message is not a string', async () => {
      const error = {
        response: {
          status: 400,
          data: { message: {} },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.register('A', '098', 'p')).rejects.toEqual(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Register error:', {
        status: 400,
        message: undefined,
      });
    });

    it('logs error when registration throws non-response error', async () => {
      const error = new Error('Connection timeout');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.register('A', '098', 'p')).rejects.toThrow(
        'Connection timeout',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Register error:', {
        status: undefined,
        message: undefined,
      });
    });
  });

  describe('forgotPassword', () => {
    it('sends forgot password request with string email and wrapped response data', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: { message: 'Mã xác nhận đã gửi' } },
      });

      const result = await authApi.forgotPassword('email@domain.com');

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/forgot-password',
        { email: 'email@domain.com' },
      );
      expect(result).toEqual({ message: 'Mã xác nhận đã gửi' });
    });

    it('sends forgot password request with object input and unwrapped response data', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { message: 'Email sent successfully' },
      });

      const result = await authApi.forgotPassword({
        email: 'email@domain.com',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/forgot-password',
        { email: 'email@domain.com' },
      );
      expect(result).toEqual({ message: 'Email sent successfully' });
    });

    it('logs error and rethrows when forgot password request fails', async () => {
      const error = new Error('Email không tồn tại');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(
        authApi.forgotPassword('unknown@domain.com'),
      ).rejects.toThrow('Email không tồn tại');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Forgot password error:',
        error,
      );
    });
  });

  describe('resetPassword', () => {
    it('resets password with separate token string and new password with wrapped response', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: { message: 'Đặt lại mật khẩu thành công' } },
      });

      const result = await authApi.resetPassword(
        'reset-tok-123',
        'newSecret123',
      );

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/reset-password',
        {
          token: 'reset-tok-123',
          newPassword: 'newSecret123',
        },
      );
      expect(result).toEqual({ message: 'Đặt lại mật khẩu thành công' });
    });

    it('resets password with object payload and unwrapped response', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { message: 'Password updated' },
      });

      const result = await authApi.resetPassword({
        token: 'obj-tok',
        newPassword: 'objNewPassword!',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/reset-password',
        {
          token: 'obj-tok',
          newPassword: 'objNewPassword!',
        },
      );
      expect(result).toEqual({ message: 'Password updated' });
    });

    it('logs error and rethrows when reset password request fails', async () => {
      const error = new Error('Token không hợp lệ hoặc đã hết hạn');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.resetPassword('bad-tok', 'newPass')).rejects.toThrow(
        'Token không hợp lệ hoặc đã hết hạn',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Reset password error:',
        error,
      );
    });
  });

  describe('getProfile', () => {
    it('retrieves and parses user profile with wrapped response data (.data.data)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: mockUser },
      });

      const result = await authApi.getProfile();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });

    it('retrieves and parses user profile with unwrapped response data (.data) and transforms null name', async () => {
      const rawProfile = {
        id: 'admin-99',
        email: null,
        name: null,
        role: 'ADMIN',
        phone: '0911223344',
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: rawProfile,
      });

      const result = await authApi.getProfile();

      expect(result).toEqual({ ...rawProfile, name: '' });
    });

    it('throws when getProfile network request fails', async () => {
      const error = new Error('Chưa đăng nhập');
      vi.mocked(apiClient.get).mockRejectedValueOnce(error);

      await expect(authApi.getProfile()).rejects.toThrow('Chưa đăng nhập');
    });

    it('throws when getProfile response fails schema validation', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { id: 'user-1', role: 'INVALID_ROLE' } },
      });

      await expect(authApi.getProfile()).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('logs out successfully and cleans up tokens, stores, and localStorage', async () => {
      localStore['user'] = JSON.stringify(mockUser);
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { message: 'Đăng xuất thành công' },
      });

      await authApi.logout();

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockedAuthToken.remove).toHaveBeenCalledTimes(1);
      expect(clearCartMock).toHaveBeenCalledTimes(1);
      expect(clearWishlistMock).toHaveBeenCalledTimes(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('cleans up local state even when backend logout fails with error message string', async () => {
      localStore['user'] = JSON.stringify(mockUser);
      const error = {
        response: {
          status: 500,
          data: { message: 'Lỗi server đăng xuất' },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.logout()).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', {
        status: 500,
        message: 'Lỗi server đăng xuất',
      });
      expect(mockedAuthToken.remove).toHaveBeenCalledTimes(1);
      expect(clearCartMock).toHaveBeenCalledTimes(1);
      expect(clearWishlistMock).toHaveBeenCalledTimes(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('cleans up local state when backend logout fails without response message string', async () => {
      localStore['user'] = JSON.stringify(mockUser);
      const error = new Error('Network offline');
      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      await expect(authApi.logout()).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', {
        status: undefined,
        message: undefined,
      });
      expect(mockedAuthToken.remove).toHaveBeenCalledTimes(1);
      expect(clearCartMock).toHaveBeenCalledTimes(1);
      expect(clearWishlistMock).toHaveBeenCalledTimes(1);
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
      localStore['user'] = '{not valid json';
      expect(authApi.getCurrentUser()).toBeNull();
    });

    it('returns null when user in localStorage fails schema validation', () => {
      localStore['user'] = JSON.stringify({ id: 123, role: 'UNKNOWN' });
      expect(authApi.getCurrentUser()).toBeNull();
    });

    it('returns parsed user when valid user JSON is stored in localStorage', () => {
      localStore['user'] = JSON.stringify(mockUser);
      const user = authApi.getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it('returns parsed user transforming null name to empty string', () => {
      const storedUser = {
        id: 'admin-1',
        email: 'ad@min.com',
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
        id: 'admin-2',
        email: 'ad2@min.com',
        role: 'ADMIN' as const,
        phone: '0909090908',
      };
      localStore['user'] = JSON.stringify(storedUser);
      const user = authApi.getCurrentUser();
      expect(user).toEqual({ ...storedUser, name: '' });
    });
  });
});
