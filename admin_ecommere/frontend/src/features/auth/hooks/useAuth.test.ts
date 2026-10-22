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
    setState: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {},
  AxiosError: class AxiosError extends Error {},
}));

let localStore: Record<string, string> = {};
const mockLocalStorage = {
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

const mockAdminUser: User = {
  id: 'admin-001',
  phone: '0987654321',
  name: 'Quản Trị Viên Hệ Thống',
  email: 'admin@thaisprayshop.vn',
  role: 'ADMIN',
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
    localStore = {};
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe('initial user query state', () => {
    it('returns currentUser when authApi.getCurrentUser returns a user object', async () => {
      const { result } = renderAuthHook(mockAdminUser);

      await waitFor(() => {
        expect(result.current.user).toEqual(mockAdminUser);
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
      expect(result.current.loginError).toBeNull();
    });
  });

  describe('login', () => {
    it('handles successful login: updates query cache, shows toast, and navigates to /', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        user: mockAdminUser,
        accessToken: 'access-token-admin',
        expiresIn: '86400s',
      });

      const { result, queryClient } = renderAuthHook(null);

      act(() => {
        result.current.login({ phone: '0987654321', password: 'password123' });
      });

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith('0987654321', 'password123');
      });

      await waitFor(() => {
        expect(queryClient.getQueryData([QUERY_KEYS.USER])).toEqual(
          mockAdminUser,
        );
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        `Chào mừng trở lại, ${mockAdminUser.name}!`,
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('handles login failure with custom backend error message', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Tài khoản hoặc mật khẩu không chính xác',
          },
        },
      };
      vi.mocked(authApi.login).mockRejectedValue(axiosError);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.login({
          phone: '0987654321',
          password: 'wrongpassword',
        });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Tài khoản hoặc mật khẩu không chính xác',
        );
      });

      expect(result.current.loginError).toEqual(axiosError);
    });

    it('handles login failure without response message using fallback message', async () => {
      const networkError = new Error('Network timeout');
      vi.mocked(authApi.login).mockRejectedValue(networkError);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.login({ phone: '0987654321', password: 'password123' });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Đăng nhập thất bại. Vui lòng kiểm tra lại số điện thoại và mật khẩu.',
        );
      });
    });

    it('handles login failure with empty response data using fallback message', async () => {
      const errorWithoutMessage = {
        response: {
          data: {},
        },
      };
      vi.mocked(authApi.login).mockRejectedValue(errorWithoutMessage);

      const { result } = renderAuthHook(null);

      act(() => {
        result.current.login({ phone: '0987654321', password: 'password123' });
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Đăng nhập thất bại. Vui lòng kiểm tra lại số điện thoại và mật khẩu.',
        );
      });
    });
  });

  describe('logout', () => {
    it('handles successful logout: resets chat, clears query cache, shows toast, and navigates to /login', async () => {
      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result, queryClient } = renderAuthHook(mockAdminUser);
      await waitFor(() => {
        expect(result.current.user).toEqual(mockAdminUser);
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

      const { result, queryClient } = renderAuthHook(mockAdminUser);
      await waitFor(() => {
        expect(result.current.user).toEqual(mockAdminUser);
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
        ...mockAdminUser,
        name: 'Quản Trị Viên Đã Cập Nhật',
      };
      vi.mocked(authApi.getProfile).mockResolvedValue(updatedUser);

      const { result, queryClient } = renderAuthHook(mockAdminUser);
      await waitFor(() => {
        expect(result.current.user).toEqual(mockAdminUser);
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

      const { result } = renderAuthHook(mockAdminUser);
      await waitFor(() => {
        expect(result.current.user).toEqual(mockAdminUser);
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
