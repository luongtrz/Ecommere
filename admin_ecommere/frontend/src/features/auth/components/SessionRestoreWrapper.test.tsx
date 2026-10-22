import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionRestoreWrapper } from './SessionRestoreWrapper';
import { authToken, refreshAccessToken } from '@/lib/api';
import { useCartStore } from '@/features/cart/store/cartStore';

vi.mock('axios');

vi.mock('@/lib/api', () => ({
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    decode: vi.fn(),
  },
  refreshAccessToken: vi.fn(),
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
      assign: vi.fn(),
      reload: vi.fn(),
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
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    consoleLogSpy.mockRestore();
    try {
      window.location = originalLocation as any;
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
    // Allow microtasks and .finally blocks to settle
    await Promise.resolve();
    await Promise.resolve();
  });

  it('renders children properly', () => {
    render(
      <SessionRestoreWrapper>
        <div data-testid="child-element">Bảng điều khiển quản trị</div>
      </SessionRestoreWrapper>,
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Bảng điều khiển quản trị')).toBeInTheDocument();
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('renders multiple children properly inside fragment', () => {
    render(
      <SessionRestoreWrapper>
        <header data-testid="header">Header quản trị</header>
        <main data-testid="main">Nội dung chính</main>
      </SessionRestoreWrapper>,
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('main')).toBeInTheDocument();
  });

  it('handles null children without error', () => {
    const { container } = render(
      <SessionRestoreWrapper>{null}</SessionRestoreWrapper>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('does not attempt to refresh token if user does not exist in localStorage', async () => {
    render(
      <SessionRestoreWrapper>
        <div>Nội dung trang</div>
      </SessionRestoreWrapper>,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(Storage.prototype.getItem).toHaveBeenCalledWith('user');
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('does not attempt to refresh token if user in localStorage is an empty string', async () => {
    mockStorage['user'] = '';

    render(
      <SessionRestoreWrapper>
        <div>Nội dung trang</div>
      </SessionRestoreWrapper>,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(Storage.prototype.getItem).toHaveBeenCalledWith('user');
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('successfully restores session when user is in localStorage and refreshAccessToken succeeds', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u1', name: 'Quản trị viên' });
    vi.mocked(refreshAccessToken).mockResolvedValueOnce('new-access-token');

    render(
      <SessionRestoreWrapper>
        <div>Trang quản lý</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    });

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(authToken.remove).not.toHaveBeenCalled();
    expect(Storage.prototype.removeItem).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
    expect(screen.getByText('Trang quản lý')).toBeInTheDocument();
  });

  it('handles session restore failure when current route is not /login: logs error, clears auth token, clears cart, removes user from storage, and redirects to /login', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u1' });
    window.location.pathname = '/admin/products';
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(
      new Error('Phiên đăng nhập đã hết hạn'),
    );

    useCartStore.setState({
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          name: 'Nước hoa Test',
          image: '/image.png',
          price: 150000,
          quantity: 2,
          scent: 'Citrus',
          volumeMl: 100,
        },
      ],
    });

    const clearCartSpy = vi.spyOn(useCartStore.getState(), 'clearCart');

    render(
      <SessionRestoreWrapper>
        <div>Trang danh sách sản phẩm</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(authToken.remove).toHaveBeenCalledTimes(1);
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('Session expired');
    expect(clearCartSpy).toHaveBeenCalledTimes(1);
    expect(useCartStore.getState().items).toEqual([]);
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    expect(mockStorage['user']).toBeUndefined();
    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });

  it('handles session restore failure when already on /login: clears session and cart but does NOT call window.location.replace', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u1' });
    window.location.pathname = '/login';
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(
      new Error('Session expired error'),
    );

    useCartStore.setState({
      items: [
        {
          productId: 'prod-2',
          variantId: 'var-2',
          name: 'Nước hoa Login',
          image: '/image2.png',
          price: 200000,
          quantity: 1,
          scent: 'Floral',
          volumeMl: 50,
        },
      ],
    });

    render(
      <SessionRestoreWrapper>
        <div>Trang đăng nhập</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(authToken.remove).toHaveBeenCalledTimes(1);
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('Session expired');
    expect(authToken.remove).toHaveBeenCalledTimes(1);
    expect(useCartStore.getState().items).toEqual([]);
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    expect(mockStorage['user']).toBeUndefined();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('handles session restore failure with non-Error rejection and redirects when on /admin', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u2' });
    window.location.pathname = '/admin';
    vi.mocked(refreshAccessToken).mockRejectedValueOnce('Network disconnect');

    render(
      <SessionRestoreWrapper>
        <div>Admin Root</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(authToken.remove).toHaveBeenCalledTimes(1);
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('Session expired');
    expect(authToken.remove).toHaveBeenCalledTimes(1);
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });

  it('reuses active sessionRestorePromise across concurrent mounts without initiating duplicate restore', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u-concurrent' });

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

  it('initiates a new restore session on a subsequent mount after the first restore settles and promise resets to null', async () => {
    mockStorage['user'] = JSON.stringify({ id: 'u-seq' });
    vi.mocked(refreshAccessToken).mockResolvedValueOnce('token-first');

    const { unmount } = render(
      <SessionRestoreWrapper>
        <div>First Mount</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    });

    unmount();
    await Promise.resolve();
    await Promise.resolve();

    vi.mocked(refreshAccessToken).mockResolvedValueOnce('token-second');

    render(
      <SessionRestoreWrapper>
        <div>Second Mount</div>
      </SessionRestoreWrapper>,
    );

    await waitFor(() => {
      expect(refreshAccessToken).toHaveBeenCalledTimes(2);
    });
  });
});
