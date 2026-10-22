import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from './useAuth';
import { authApi, type User } from '../api/auth.api';
import { QUERY_KEYS } from '@/lib/constants';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/auth.api', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}));

const mockToast = {
  toast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};
vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

const mockResetChat = vi.fn();
vi.mock('@/features/chatbot/store/chatStore', () => ({
  useChatStore: {
    getState: vi.fn(() => ({
      reset: mockResetChat,
    })),
  },
}));

vi.mock('axios', () => ({
  default: {},
  AxiosError: class AxiosError extends Error {},
}));

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const mockUser: User = {
  id: 'usr-123',
  phone: '0912345678',
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  role: 'CUSTOMER',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderAuthHook(initialUser: User | null = null) {
  vi.mocked(authApi.getCurrentUser).mockReturnValue(initialUser);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    );

  const hookResult = renderHook(() => useAuth(), { wrapper });
  return { ...hookResult, queryClient };
}

describe('useAuth', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe('initial user query state', () => {
    it('returns currentUser when authApi.getCurrentUser returns a user object', async () => {
      const { result } = renderAuthHook(mockUser);

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
      expect(result.current.isLoading).toBe(false);
      expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('returns null user when authApi.getCurrentUser returns null', async () => {
      const { result } = renderAuthHook(null);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.user).toBeNull();
      expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('returns accurate initial mutation flags and error states', () => {
      const { result } = renderAuthHook(null);

      expect(result.current.isLoginLoading).toBe(false);
      expect(result.current.isRegisterLoading).toBe(false);
      expect(result.current.isForgotPasswordLoading).toBe(false);
      expect(result.current.isResetPasswordLoading).toBe(false);

      expect(result.current.isForgotPasswordSuccess).toBe(false);
      expect(result.current.isResetPasswordSuccess).toBe(false);

      expect(result.current.loginError).toBeNull();
      expect(result.current.registerError).toBeNull();
      expect(result.current.forgotPasswordError).toBeNull();
      expect(result.current.resetPasswordError).toBeNull();
    });
  });

  describe('login', () => {
    it('handles successful login: updates query cache, shows toast, and navigates to /', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token-123',
        expiresIn: '7d',
      });

      const { result, queryClient } = renderAuthHook(null);

      act(() => {
        result.current.login({ phone: '0912345678', password: 'password123' });
      });

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith('0912345678', 'password123');
      });

      await waitFor(() => {
        expect(queryClient.getQueryData([QUERY_KEYS.USER])).toEqual(mockUser);
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        `Chào mừng trở lại, ${mockUser.name}!`,
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('handles login failure with custom backend error message', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Số điện thoại hoặc mật khẩu không chính xác',
          },
        },
      };
      vi.mocked(authApi.login).mockRejectedValue(axiosError);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.login({
          phone: '0912345678',
          password: 'wrongpassword',
        });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Số điện thoại hoặc mật khẩu không chính xác',
        );
      });

      expect(result.current.loginError).toEqual(axiosError);
    });

    it('handles login failure without response message using fallback message', async () => {
      const networkError = new Error('Network timeout');
      vi.mocked(authApi.login).mockRejectedValue(networkError);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.login({ phone: '0912345678', password: 'password123' });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Đăng nhập thất bại. Vui lòng kiểm tra lại số điện thoại và mật khẩu.',
        );
      });
    });
  });

  describe('register', () => {
    it('handles successful register: updates query cache, shows toast, and navigates to /', async () => {
      vi.mocked(authApi.register).mockResolvedValue({
        user: mockUser,
        accessToken: 'reg-token-123',
        expiresIn: '7d',
      });

      const { result, queryClient } = renderAuthHook(null);

      act(() => {
        result.current.register({
          name: mockUser.name,
          phone: mockUser.phone,
          password: 'Password@123',
          email: mockUser.email ?? undefined,
          referralCode: 'REF123',
        });
      });

      await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledWith(
          mockUser.name,
          mockUser.phone,
          'Password@123',
          mockUser.email,
          'REF123',
        );
      });

      await waitFor(() => {
        expect(queryClient.getQueryData([QUERY_KEYS.USER])).toEqual(mockUser);
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        `Đăng ký thành công! Chào mừng ${mockUser.name}!`,
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('handles register failure with custom backend error message', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Số điện thoại này đã được sử dụng',
          },
        },
      };
      vi.mocked(authApi.register).mockRejectedValue(axiosError);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.register({
          name: 'Nguyễn Văn B',
          phone: '0987654321',
          password: 'Password@123',
        });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Số điện thoại này đã được sử dụng',
        );
      });

      expect(result.current.registerError).toEqual(axiosError);
    });

    it('handles register failure without response message using fallback message', async () => {
      vi.mocked(authApi.register).mockRejectedValue(
        new Error('Connection error'),
      );

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.register({
          name: 'Nguyễn Văn B',
          phone: '0987654321',
          password: 'Password@123',
        });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Đăng ký thất bại. Số điện thoại có thể đã được sử dụng.',
        );
      });
    });
  });

  describe('forgotPassword', () => {
    it('handles successful forgotPassword: calls api and shows success toast', async () => {
      vi.mocked(authApi.forgotPassword).mockResolvedValue({ message: 'OK' });

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.forgotPassword('user@example.com');
      });

      await waitFor(() => {
        expect(authApi.forgotPassword).toHaveBeenCalledWith('user@example.com');
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Nếu email tồn tại, liên kết đặt lại mật khẩu sẽ được gửi',
        );
      });

      expect(result.current.isForgotPasswordSuccess).toBe(true);
    });

    it('handles forgotPassword failure with array of messages', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: ['Email không đúng định dạng', 'Email không tồn tại'],
          },
        },
      };
      vi.mocked(authApi.forgotPassword).mockRejectedValue(axiosError);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.forgotPassword('bad-email');
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Email không đúng định dạng, Email không tồn tại',
        );
      });

      expect(result.current.forgotPasswordError).toEqual(axiosError);
    });

    it('handles forgotPassword failure with single string message', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Email không tồn tại trên hệ thống',
          },
        },
      };
      vi.mocked(authApi.forgotPassword).mockRejectedValue(axiosError);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.forgotPassword('unknown@example.com');
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Email không tồn tại trên hệ thống',
        );
      });
    });

    it('handles forgotPassword failure without response message using fallback message', async () => {
      vi.mocked(authApi.forgotPassword).mockRejectedValue(
        new Error('Internal Server Error'),
      );

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.forgotPassword('test@example.com');
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        );
      });
    });
  });

  describe('resetPassword', () => {
    it('handles successful resetPassword: calls api, shows toast, and navigates to /login', async () => {
      vi.mocked(authApi.resetPassword).mockResolvedValue({ message: 'OK' });

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.resetPassword({
          token: 'token-abc',
          newPassword: 'NewPassword@123',
        });
      });

      await waitFor(() => {
        expect(authApi.resetPassword).toHaveBeenCalledWith(
          'token-abc',
          'NewPassword@123',
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.',
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(result.current.isResetPasswordSuccess).toBe(true);
    });

    it('handles resetPassword failure with array of messages', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: ['Mã xác nhận hết hạn', 'Mật khẩu không đạt độ dài'],
          },
        },
      };
      vi.mocked(authApi.resetPassword).mockRejectedValue(axiosError);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.resetPassword({
          token: 'token-abc',
          newPassword: '123',
        });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Mã xác nhận hết hạn, Mật khẩu không đạt độ dài',
        );
      });

      expect(result.current.resetPasswordError).toEqual(axiosError);
    });

    it('handles resetPassword failure with single string message', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Mã xác nhận không hợp lệ',
          },
        },
      };
      vi.mocked(authApi.resetPassword).mockRejectedValue(axiosError);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.resetPassword({
          token: 'invalid-token',
          newPassword: 'NewPassword@123',
        });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Mã xác nhận không hợp lệ',
        );
      });
    });

    it('handles resetPassword failure without response message using fallback message', async () => {
      vi.mocked(authApi.resetPassword).mockRejectedValue(
        new Error('Reset error'),
      );

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.resetPassword({
          token: 'token-abc',
          newPassword: 'NewPassword@123',
        });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại.',
        );
      });
    });
  });

  describe('logout', () => {
    it('handles successful logout: resets chat, clears query cache, shows toast, and navigates to /login', async () => {
      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result, queryClient } = renderAuthHook(mockUser);
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
      const clearSpy = vi.spyOn(queryClient, 'clear');

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalledTimes(1);
      expect(mockResetChat).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(mockToast.info).toHaveBeenCalledWith('Đã đăng xuất thành công');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('handles failed logout: still resets chat and clears queries, navigates to /login without toast', async () => {
      vi.mocked(authApi.logout).mockRejectedValue(
        new Error('Logout failed on backend'),
      );

      const { result, queryClient } = renderAuthHook(mockUser);
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
      const clearSpy = vi.spyOn(queryClient, 'clear');

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalledTimes(1);
      expect(mockResetChat).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(mockToast.info).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('refreshUser', () => {
    it('handles successful refreshUser: fetches profile, updates query cache and localStorage, and returns updated user', async () => {
      const updatedUser: User = {
        ...mockUser,
        name: 'Nguyễn Văn A Cập Nhật',
      };
      vi.mocked(authApi.getProfile).mockResolvedValue(updatedUser);

      const { result, queryClient } = renderAuthHook(mockUser);
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      let returnedUser: User | undefined;
      await act(async () => {
        returnedUser = await result.current.refreshUser();
      });

      expect(authApi.getProfile).toHaveBeenCalledTimes(1);
      expect(returnedUser).toEqual(updatedUser);
      await waitFor(() => {
        expect(queryClient.getQueryData([QUERY_KEYS.USER])).toEqual(
          updatedUser,
        );
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(updatedUser),
      );
    });

    it('handles failed refreshUser: logs error to console and rethrows the error', async () => {
      const profileError = new Error('Unauthorized');
      vi.mocked(authApi.getProfile).mockRejectedValue(profileError);
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderAuthHook(mockUser);
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      let caughtError: unknown;
      await act(async () => {
        try {
          await result.current.refreshUser();
        } catch (err) {
          caughtError = err;
        }
      });

      expect(caughtError).toBe(profileError);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to refresh user:',
        profileError,
      );
      consoleSpy.mockRestore();
    });
  });
});
