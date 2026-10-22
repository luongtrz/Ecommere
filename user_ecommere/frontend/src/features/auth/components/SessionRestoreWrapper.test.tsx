import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionRestoreWrapper } from './SessionRestoreWrapper';
import { authToken, refreshAccessToken } from '@/lib/api';
import { useCartStore } from '@/features/cart/store/cartStore';
import { isProtectedRoute } from '@/app/router';

vi.mock('@/lib/api', () => ({
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    decode: vi.fn(),
  },
  refreshAccessToken: vi.fn(),
}));

vi.mock('@/app/router', () => ({
  isProtectedRoute: vi.fn(),
}));

describe('SessionRestoreWrapper', () => {
  let mockStorage: Record<string, string> = {};
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return mockStorage[key] ?? null;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        mockStorage[key] = String(value);
      },
    );
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key: string) => {
        delete mockStorage[key];
      },
    );
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      mockStorage = {};
    });

    try {
      delete (window as any).location;
    } catch {
      // ignore
    }

    const mockLocation = {
      ...originalLocation,
      pathname: '/',
      replace: vi.fn(),
    };

    try {
      window.location = mockLocation as any;
    } catch {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: mockLocation,
      });
    }

    useCartStore.setState({
      items: [],
      isOpen: false,
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    consoleLogSpy.mockRestore();
    try {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        configurable: true,
      });
    } catch {
      try {
        Object.defineProperty(window, 'location', {
          configurable: true,
          writable: true,
          value: originalLocation,
        });
      } catch {
        // ignore
      }
    }
    // Allow any microtasks and .finally blocks to settle
    await Promise.resolve();
    await Promise.resolve();
  });

  it('renders children properly', () => {
    render(
      <SessionRestoreWrapper>
        <div data-testid="child-element">Test Child Content</div>
      </SessionRestoreWrapper>,
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('does not attempt to refresh token if user does not exist in localStorage', async () => {
    render(
      <SessionRestoreWrapper>
        <div>Content</div>
      </SessionRestoreWrapper>,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(Storage.prototype.getItem).toHaveBeenCalledWith('user');
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
  });

  it('does not attempt to refresh token if user in localStorage is an empty string', async () => {
    mockStorage['user'] = '';

    render(
      <SessionRestoreWrapper>
        <div>Content</div>
      </SessionRestoreWrapper>,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(Storage.prototype.getItem).toHaveBeenCalledWith('user');
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
  });

  it('successfully restores session when user is in localStorage and refreshAccessToken succeeds', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u1', name: 'John Doe' });
    vi.mocked(refreshAccessToken).mockResolvedValueOnce('new-access-token');

    render(
      <SessionRestoreWrapper>
        <div>Content</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    });

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
    expect(Storage.prototype.removeItem).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('handles session restore failure on a protected route by logging, clearing auth token, clearing cart, removing user from storage, and redirecting to /login', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u1' });
    window.location.pathname = '/checkout';
    vi.mocked(isProtectedRoute).mockReturnValue(true);
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(
      new Error('Session expired error'),
    );

    useCartStore.setState({
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          name: 'Product 1',
          image: '/image.png',
          price: 150000,
          quantity: 2,
          scent: 'Citrus',
          volumeMl: 100,
        },
      ],
      isOpen: false,
    });

    const clearCartSpy = vi.spyOn(useCartStore.getState(), 'clearCart');

    render(
      <SessionRestoreWrapper>
        <div>Protected Page Content</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(authToken.remove).toHaveBeenCalledTimes(1);
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('Session expired');
    expect(clearCartSpy).toHaveBeenCalledTimes(1);
    expect(useCartStore.getState().items).toEqual([]);
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    expect(isProtectedRoute).toHaveBeenCalledWith('/checkout');
    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });

  it('handles session restore failure on an unprotected route: clears session and cart but does not redirect', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u1' });
    window.location.pathname = '/catalog';
    vi.mocked(isProtectedRoute).mockReturnValue(false);
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(
      new Error('Session expired error'),
    );

    render(
      <SessionRestoreWrapper>
        <div>Public Catalog Content</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(authToken.remove).toHaveBeenCalledTimes(1);
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('Session expired');
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    expect(isProtectedRoute).toHaveBeenCalledWith('/catalog');
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('handles session restore failure when already on /login: does not call isProtectedRoute and does not redirect', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u1' });
    window.location.pathname = '/login';
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(
      new Error('Session expired error'),
    );

    render(
      <SessionRestoreWrapper>
        <div>Login Page Content</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(authToken.remove).toHaveBeenCalledTimes(1);
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('Session expired');
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    expect(isProtectedRoute).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('reuses active sessionRestorePromise across concurrent mounts without initiating duplicate restore', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u1' });

    let resolveRefresh!: (value: string) => void;
    const pendingPromise = new Promise<string>((resolve) => {
      resolveRefresh = resolve;
    });
    vi.mocked(refreshAccessToken).mockReturnValue(pendingPromise);

    render(
      <>
        <SessionRestoreWrapper>
          <div>Child One</div>
        </SessionRestoreWrapper>
        <SessionRestoreWrapper>
          <div>Child Two</div>
        </SessionRestoreWrapper>
      </>,
    );

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);

    resolveRefresh('restored-token');

    await waitFor(() => {
      expect(screen.getByText('Child One')).toBeInTheDocument();
      expect(screen.getByText('Child Two')).toBeInTheDocument();
    });

    await Promise.resolve();
    await Promise.resolve();
  });
});
