import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const { mockAxiosInstance, mockClearCart, mockResetChat } = vi.hoisted(() => {
  const instance: any = vi.fn((config) =>
    Promise.resolve({ data: 'replayed', config }),
  );
  instance.interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  instance.post = vi.fn();
  instance.get = vi.fn();
  instance.put = vi.fn();
  instance.delete = vi.fn();
  instance.patch = vi.fn();
  instance.defaults = { headers: {} };

  return {
    mockAxiosInstance: instance,
    mockClearCart: vi.fn(),
    mockResetChat: vi.fn(),
  };
});

vi.mock('axios', () => {
  const createFn = vi.fn(() => mockAxiosInstance);
  return {
    default: {
      create: createFn,
    },
    create: createFn,
  };
});

vi.mock('@/features/cart/store/cartStore', () => ({
  useCartStore: {
    getState: vi.fn(() => ({
      clearCart: mockClearCart,
    })),
    setState: vi.fn(),
  },
}));

vi.mock('@/features/chatbot/store/chatStore', () => ({
  useChatStore: {
    getState: vi.fn(() => ({
      reset: mockResetChat,
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

let cookieJar = '';
Object.defineProperty(document, 'cookie', {
  get: () => cookieJar,
  set: (val: string) => {
    cookieJar = val;
  },
  configurable: true,
});

const originalLocation = window.location;
const mockLocation = {
  ...originalLocation,
  pathname: '/',
  href: 'http://localhost/',
};

Object.defineProperty(window, 'location', {
  configurable: true,
  writable: true,
  value: mockLocation,
});

import apiClient, {
  API_BASE_URL,
  apiClient as namedApiClient,
  authToken,
  getCookie,
  registerQueryCacheClear,
  clearQueryCache,
  refreshAccessToken,
} from './api';

describe('api module', () => {
  // Capture interceptor handlers and invocation count before beforeEach clears mock history
  const requestUseCallCount =
    mockAxiosInstance.interceptors.request.use.mock.calls.length;
  const responseUseCallCount =
    mockAxiosInstance.interceptors.response.use.mock.calls.length;
  const requestInterceptor =
    mockAxiosInstance.interceptors.request.use.mock.calls[0]?.[0];
  const requestErrorInterceptor =
    mockAxiosInstance.interceptors.request.use.mock.calls[0]?.[1];
  const responseInterceptor =
    mockAxiosInstance.interceptors.response.use.mock.calls[0]?.[0];
  const responseErrorInterceptor =
    mockAxiosInstance.interceptors.response.use.mock.calls[0]?.[1];

  beforeEach(() => {
    vi.clearAllMocks();
    localStore = {};
    cookieJar = '';
    authToken.remove();
    registerQueryCacheClear(null as any);
    mockLocation.pathname = '/';
    mockLocation.href = 'http://localhost/';
    mockAxiosInstance.mockReset();
    mockAxiosInstance.mockImplementation((config: any) =>
      Promise.resolve({ data: 'replayed', config }),
    );
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.post.mockResolvedValue({
      data: { accessToken: 'default-mock-token' },
    });
  });

  afterEach(() => {
    authToken.remove();
    registerQueryCacheClear(null as any);
  });

  describe('API_BASE_URL and apiClient configuration', () => {
    it('exports a valid API_BASE_URL string', () => {
      expect(typeof API_BASE_URL).toBe('string');
      expect(API_BASE_URL.length).toBeGreaterThan(0);
    });

    it('exports default apiClient matching named apiClient', () => {
      expect(apiClient).toBeDefined();
      expect(namedApiClient).toBe(apiClient);
      expect(apiClient).toBe(mockAxiosInstance);
    });

    it('registered request and response interceptors on create', () => {
      expect(requestUseCallCount).toBe(1);
      expect(responseUseCallCount).toBe(1);
      expect(typeof requestInterceptor).toBe('function');
      expect(typeof requestErrorInterceptor).toBe('function');
      expect(typeof responseInterceptor).toBe('function');
      expect(typeof responseErrorInterceptor).toBe('function');
    });
  });

  describe('authToken', () => {
    it('returns null initially and after remove', () => {
      expect(authToken.get()).toBeNull();
      authToken.set('token-123');
      expect(authToken.get()).toBe('token-123');
      authToken.remove();
      expect(authToken.get()).toBeNull();
    });

    it('decodes a valid JWT token', () => {
      // payload: {"sub":"admin-1","email":"admin@example.com","role":"ADMIN"}
      const validJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiJ9.signature';
      const decoded = authToken.decode(validJwt);
      expect(decoded).toEqual({
        sub: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });

    it('returns null when decoding an invalid or malformed JWT token', () => {
      expect(authToken.decode('invalid-jwt')).toBeNull();
      expect(authToken.decode('')).toBeNull();
      expect(authToken.decode('not.a.valid.jwt.token')).toBeNull();
    });
  });

  describe('getCookie', () => {
    it('reads a cookie when it is the only cookie present', () => {
      cookieJar = 'csrf_token=token-alpha';
      expect(getCookie('csrf_token')).toBe('token-alpha');
    });

    it('reads a cookie positioned at the start of multiple cookies', () => {
      cookieJar = 'csrf_token=token-start; other=123';
      expect(getCookie('csrf_token')).toBe('token-start');
    });

    it('reads a cookie positioned in the middle of multiple cookies', () => {
      cookieJar = 'theme=dark; csrf_token=token-mid; session=abc';
      expect(getCookie('csrf_token')).toBe('token-mid');
    });

    it('reads a cookie positioned at the end of multiple cookies', () => {
      cookieJar = 'theme=dark; session=abc; csrf_token=token-end';
      expect(getCookie('csrf_token')).toBe('token-end');
    });

    it('returns null when cookie does not exist', () => {
      cookieJar = 'theme=dark; session=abc';
      expect(getCookie('csrf_token')).toBeNull();
      cookieJar = '';
      expect(getCookie('csrf_token')).toBeNull();
    });

    it('returns null when cookie has an empty value', () => {
      cookieJar = 'csrf_token=; other=abc';
      expect(getCookie('csrf_token')).toBeNull();
    });

    it('returns null when cookie name appears multiple times in cookie string', () => {
      cookieJar = 'csrf_token=first; csrf_token=second';
      expect(getCookie('csrf_token')).toBeNull();
    });
  });

  describe('registerQueryCacheClear and clearQueryCache', () => {
    it('does not throw when clearQueryCache is called without a registered callback', () => {
      expect(() => clearQueryCache()).not.toThrow();
    });

    it('calls the registered callback when clearQueryCache is executed', () => {
      const mockClear = vi.fn();
      registerQueryCacheClear(mockClear);
      clearQueryCache();
      expect(mockClear).toHaveBeenCalledTimes(1);
    });

    it('swallows errors thrown by clearQueryCacheCallback so caller is not interrupted', () => {
      const failingClear = vi.fn(() => {
        throw new Error('Query cache clear error');
      });
      registerQueryCacheClear(failingClear);
      expect(() => clearQueryCache()).not.toThrow();
      expect(failingClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshAccessToken', () => {
    it('refreshes token successfully with nested response format (.data.data.accessToken)', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { data: { accessToken: 'wrapped-access-token-001' } },
      });

      const token = await refreshAccessToken();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh');
      expect(token).toBe('wrapped-access-token-001');
      expect(authToken.get()).toBe('wrapped-access-token-001');
    });

    it('refreshes token successfully with flat response format (.data.accessToken)', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { accessToken: 'flat-access-token-002' },
      });

      const token = await refreshAccessToken();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh');
      expect(token).toBe('flat-access-token-002');
      expect(authToken.get()).toBe('flat-access-token-002');
    });

    it('deduplicates concurrent calls to refreshAccessToken into a single request', async () => {
      let resolveRefresh!: (val: any) => void;
      const deferredPromise = new Promise((res) => {
        resolveRefresh = res;
      });
      mockAxiosInstance.post.mockReturnValueOnce(deferredPromise);

      try {
        const promise1 = refreshAccessToken();
        const promise2 = refreshAccessToken();

        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);

        resolveRefresh({
          data: { accessToken: 'shared-token-003' },
        });

        const [res1, res2] = await Promise.all([promise1, promise2]);
        expect(res1).toBe('shared-token-003');
        expect(res2).toBe('shared-token-003');
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      } finally {
        resolveRefresh({ data: { accessToken: 'cleanup-token' } });
      }
    });

    it('allows a subsequent call after completion since refreshPromise resets to null', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { accessToken: 'token-run-1' },
      });
      const first = await refreshAccessToken();
      expect(first).toBe('token-run-1');

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { accessToken: 'token-run-2' },
      });
      const second = await refreshAccessToken();
      expect(second).toBe('token-run-2');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });

    it('clears refreshPromise in finally block on refresh failure', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(
        new Error('Token expired or revoked'),
      );

      await expect(refreshAccessToken()).rejects.toThrow(
        'Token expired or revoked',
      );

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { accessToken: 'recovered-token-004' },
      });
      const recovered = await refreshAccessToken();
      expect(recovered).toBe('recovered-token-004');
    });
  });

  describe('request interceptor', () => {
    it('does not add Authorization header when authToken is null', () => {
      const config: any = { headers: {}, method: 'get' };
      const modified = requestInterceptor(config);
      expect(modified.headers.Authorization).toBeUndefined();
    });

    it('adds Authorization header when authToken is set', () => {
      authToken.set('my-admin-access-token');
      const config: any = { headers: {}, method: 'get' };
      const modified = requestInterceptor(config);
      expect(modified.headers.Authorization).toBe(
        'Bearer my-admin-access-token',
      );
    });

    it('adds X-CSRF-Token header on post, put, patch, delete methods when csrf_token cookie exists', () => {
      cookieJar = 'csrf_token=csrf-secret-admin';

      const mutationMethods = [
        'post',
        'POST',
        'put',
        'PUT',
        'patch',
        'PATCH',
        'delete',
        'DELETE',
      ];

      mutationMethods.forEach((method) => {
        const config: any = { headers: {}, method };
        const modified = requestInterceptor(config);
        expect(modified.headers['X-CSRF-Token']).toBe('csrf-secret-admin');
      });
    });

    it('does not add X-CSRF-Token when csrf_token cookie is missing on mutation methods', () => {
      cookieJar = 'other=value';
      const config: any = { headers: {}, method: 'post' };
      const modified = requestInterceptor(config);
      expect(modified.headers['X-CSRF-Token']).toBeUndefined();
    });

    it('does not add X-CSRF-Token on non-mutation methods even if cookie is present', () => {
      cookieJar = 'csrf_token=csrf-secret-admin';
      const nonMutationMethods = ['get', 'GET', 'head', 'HEAD', 'options'];

      nonMutationMethods.forEach((method) => {
        const config: any = { headers: {}, method };
        const modified = requestInterceptor(config);
        expect(modified.headers['X-CSRF-Token']).toBeUndefined();
      });
    });

    it('does not add X-CSRF-Token when method is undefined', () => {
      cookieJar = 'csrf_token=csrf-secret-admin';
      const config: any = { headers: {} };
      const modified = requestInterceptor(config);
      expect(modified.headers['X-CSRF-Token']).toBeUndefined();
    });

    it('rejects request errors in requestErrorInterceptor', async () => {
      const err = new Error('Request config error');
      await expect(requestErrorInterceptor(err)).rejects.toBe(err);
    });
  });

  describe('response interceptor', () => {
    it('returns successful response directly', () => {
      const response = { status: 200, data: { success: true } } as any;
      expect(responseInterceptor(response)).toBe(response);
    });

    it('rejects non-401 errors without attempting token refresh', async () => {
      const statuses = [400, 403, 404, 500];

      for (const status of statuses) {
        const error = {
          config: { url: '/products' },
          response: { status },
        };
        await expect(responseErrorInterceptor(error)).rejects.toBe(error);
        expect(mockAxiosInstance.post).not.toHaveBeenCalled();
      }
    });

    it('rejects errors with no response property without attempting refresh', async () => {
      const networkError = { config: { url: '/products' } };
      await expect(responseErrorInterceptor(networkError)).rejects.toBe(
        networkError,
      );
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('rejects 401 error if originalRequest._retry is already true', async () => {
      const error = {
        config: { url: '/orders', _retry: true },
        response: { status: 401 },
      };
      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('rejects 401 error if request url is the refresh endpoint (/auth/refresh)', async () => {
      const error = {
        config: { url: '/api/auth/refresh' },
        response: { status: 401 },
      };
      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('rejects 401 error if config is missing', async () => {
      const error = {
        config: undefined,
        response: { status: 401 },
      };
      await expect(responseErrorInterceptor(error)).rejects.toThrow(TypeError);
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('successfully refreshes token on 401 and replays the original request', async () => {
      const originalRequest: any = {
        url: '/admin/stats',
        headers: {},
      };
      const error = {
        config: originalRequest,
        response: { status: 401 },
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { accessToken: 'refreshed-admin-token-999' },
      });
      mockAxiosInstance.mockResolvedValueOnce({
        data: { totalRevenue: 1000000 },
      });

      const result = await responseErrorInterceptor(error);

      expect(originalRequest._retry).toBe(true);
      expect(originalRequest.headers.Authorization).toBe(
        'Bearer refreshed-admin-token-999',
      );
      expect(mockAxiosInstance).toHaveBeenCalledWith(originalRequest);
      expect(result).toEqual({ data: { totalRevenue: 1000000 } });
    });

    it('queues concurrent 401 requests while refresh is in flight and replays all on success', async () => {
      const req1: any = { url: '/api/admin/orders', headers: {} };
      const req2: any = { url: '/api/admin/products', headers: {} };
      const err1 = { config: req1, response: { status: 401 } };
      const err2 = { config: req2, response: { status: 401 } };

      let resolveRefresh!: (val: any) => void;
      const refreshPromise = new Promise((res) => {
        resolveRefresh = res;
      });
      mockAxiosInstance.post.mockReturnValueOnce(refreshPromise);

      try {
        // Start first 401 error which sets isRefreshing = true
        const p1 = responseErrorInterceptor(err1);
        // Synchronously trigger second 401 which hits isRefreshing = true and pushes to failedQueue
        const p2 = responseErrorInterceptor(err2);

        mockAxiosInstance.mockImplementation(async (cfg: any) => ({
          data: `replayed-${cfg.url}`,
        }));

        // Resolve the token refresh
        resolveRefresh({ data: { accessToken: 'concurrent-admin-token-111' } });

        const [res1, res2] = await Promise.all([p1, p2]);

        expect(req1._retry).toBe(true);
        expect(req2._retry).toBe(true);
        expect(req1.headers.Authorization).toBe(
          'Bearer concurrent-admin-token-111',
        );
        expect(req2.headers.Authorization).toBe(
          'Bearer concurrent-admin-token-111',
        );
        expect(res1).toEqual({ data: 'replayed-/api/admin/orders' });
        expect(res2).toEqual({ data: 'replayed-/api/admin/products' });
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      } finally {
        resolveRefresh({ data: { accessToken: 'cleanup-token' } });
      }
    });

    it('handles failure when a queued replayed request rejects after refresh', async () => {
      const req1: any = { url: '/api/admin/orders', headers: {} };
      const req2: any = { url: '/api/admin/products', headers: {} };
      const err1 = { config: req1, response: { status: 401 } };
      const err2 = { config: req2, response: { status: 401 } };

      let resolveRefresh!: (val: any) => void;
      mockAxiosInstance.post.mockReturnValueOnce(
        new Promise((res) => {
          resolveRefresh = res;
        }),
      );

      try {
        const p1 = responseErrorInterceptor(err1);
        const p2 = responseErrorInterceptor(err2);

        const queuedReplayError = new Error('Product service unavailable');
        mockAxiosInstance.mockImplementation(async (cfg: any) => {
          if (cfg.url === '/api/admin/products') {
            throw queuedReplayError;
          }
          return { data: 'orders-ok' };
        });

        resolveRefresh({ data: { accessToken: 'token-abc' } });

        const res1 = await p1;
        expect(res1).toEqual({ data: 'orders-ok' });
        await expect(p2).rejects.toBe(queuedReplayError);
      } finally {
        resolveRefresh({ data: { accessToken: 'cleanup-token' } });
      }
    });

    it('cleans up tokens, stores, query cache, dispatches session-expired event, and redirects to /login when refresh fails and pathname !== /login', async () => {
      mockLocation.pathname = '/dashboard';
      mockLocation.href = 'http://localhost/dashboard';
      localStore['user'] = JSON.stringify({ id: 'admin-001' });
      authToken.set('expired-admin-token');

      let sessionExpiredEventFired = false;
      const onSessionExpired = () => {
        sessionExpiredEventFired = true;
      };
      window.addEventListener('session-expired', onSessionExpired);

      const clearCacheSpy = vi.fn();
      registerQueryCacheClear(clearCacheSpy);

      const refreshError = new Error('Refresh token expired');
      mockAxiosInstance.post.mockRejectedValueOnce(refreshError);

      const originalRequest: any = { url: '/admin/settings', headers: {} };
      const error = { config: originalRequest, response: { status: 401 } };

      await expect(responseErrorInterceptor(error)).rejects.toBe(refreshError);

      expect(authToken.get()).toBeNull();
      expect(mockResetChat).toHaveBeenCalledTimes(1);
      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(localStore['user']).toBeUndefined();
      expect(sessionExpiredEventFired).toBe(true);
      expect(clearCacheSpy).toHaveBeenCalledTimes(1);
      expect(mockLocation.href).toBe('/login');

      window.removeEventListener('session-expired', onSessionExpired);
    });

    it('cleans up state without redirecting when refresh fails and pathname is already /login', async () => {
      mockLocation.pathname = '/login';
      mockLocation.href = 'http://localhost/login';
      localStore['user'] = JSON.stringify({ id: 'admin-002' });
      authToken.set('expired-admin-token');

      let sessionExpiredEventFired = false;
      const onSessionExpired = () => {
        sessionExpiredEventFired = true;
      };
      window.addEventListener('session-expired', onSessionExpired);

      const clearCacheSpy = vi.fn();
      registerQueryCacheClear(clearCacheSpy);

      const refreshError = new Error('Invalid refresh token');
      mockAxiosInstance.post.mockRejectedValueOnce(refreshError);

      const originalRequest: any = { url: '/admin/me', headers: {} };
      const error = { config: originalRequest, response: { status: 401 } };

      await expect(responseErrorInterceptor(error)).rejects.toBe(refreshError);

      expect(authToken.get()).toBeNull();
      expect(mockResetChat).toHaveBeenCalledTimes(1);
      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(localStore['user']).toBeUndefined();
      expect(sessionExpiredEventFired).toBe(true);
      expect(clearCacheSpy).toHaveBeenCalledTimes(1);
      expect(mockLocation.href).toBe('http://localhost/login');

      window.removeEventListener('session-expired', onSessionExpired);
    });

    it('rejects queued concurrent requests when refresh fails', async () => {
      const req1: any = { url: '/req1', headers: {} };
      const req2: any = { url: '/req2', headers: {} };
      const err1 = { config: req1, response: { status: 401 } };
      const err2 = { config: req2, response: { status: 401 } };

      let rejectRefresh!: (err: any) => void;
      mockAxiosInstance.post.mockReturnValueOnce(
        new Promise((_, rej) => {
          rejectRefresh = rej;
        }),
      );

      try {
        const p1 = responseErrorInterceptor(err1);
        const p2 = responseErrorInterceptor(err2);

        const refreshFailError = new Error('Session terminated');
        rejectRefresh(refreshFailError);

        await expect(p1).rejects.toBe(refreshFailError);
        await expect(p2).rejects.toBe(refreshFailError);
      } finally {
        rejectRefresh(new Error('cleanup-fail'));
      }
    });
  });
});
