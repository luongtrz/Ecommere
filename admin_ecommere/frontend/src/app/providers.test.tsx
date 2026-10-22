import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { AppProviders } from './providers';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from 'sonner';
import { SessionRestoreWrapper } from '@/features/auth/components/SessionRestoreWrapper';

vi.mock('@/lib/queryClient', async () => {
  const { QueryClient } = await import('@tanstack/react-query');
  return {
    queryClient: new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
  };
});

vi.mock('sonner', () => ({
  Toaster: vi.fn(
    (props: {
      position?: string;
      richColors?: boolean;
      closeButton?: boolean;
      duration?: number;
    }) => (
      <div
        data-testid="sonner-toaster"
        data-position={props.position}
        data-rich-colors={String(props.richColors)}
        data-close-button={String(props.closeButton)}
        data-duration={String(props.duration)}
      >
        Sonner Toaster
      </div>
    ),
  ),
}));

vi.mock('@/features/auth/components/SessionRestoreWrapper', () => ({
  SessionRestoreWrapper: vi.fn(
    ({ children }: { children: React.ReactNode }) => (
      <div data-testid="session-restore-wrapper">{children}</div>
    ),
  ),
}));

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: vi.fn(
    ({ initialIsOpen }: { initialIsOpen?: boolean }) => (
      <div
        data-testid="react-query-devtools"
        data-initial-is-open={String(initialIsOpen)}
      >
        React Query Devtools
      </div>
    ),
  ),
}));

vi.mock('@/features/catalog/api/categories.api', () => ({
  categoriesApi: {
    getAll: vi.fn().mockResolvedValue([]),
    getTree: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/api', () => ({
  api: {},
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  refreshAccessToken: vi.fn().mockResolvedValue({}),
  registerQueryCacheClear: vi.fn(),
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('AppProviders', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders children wrapped inside SessionRestoreWrapper and QueryClientProvider', () => {
    render(
      <AppProviders>
        <div data-testid="child-element">Nội dung trang quản trị</div>
      </AppProviders>,
    );

    const child = screen.getByTestId('child-element');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Nội dung trang quản trị');

    const wrapper = screen.getByTestId('session-restore-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toContainElement(child);
    expect(SessionRestoreWrapper).toHaveBeenCalled();
  });

  it('provides the queryClient context so child hooks can interact with it', async () => {
    function QueryConsumer() {
      const client = useQueryClient();
      const [val, setVal] = useState(
        client.getQueryData<string>(['admin-status']) ?? 'chưa khởi tạo',
      );

      return (
        <div>
          <span data-testid="status-val">{val}</span>
          <button
            onClick={() => {
              client.setQueryData(['admin-status'], 'đang hoạt động');
              setVal(client.getQueryData<string>(['admin-status']) ?? '');
            }}
          >
            Cập nhật trạng thái
          </button>
        </div>
      );
    }

    const user = userEvent.setup();
    render(
      <AppProviders>
        <QueryConsumer />
      </AppProviders>,
    );

    expect(screen.getByTestId('status-val')).toHaveTextContent('chưa khởi tạo');

    const btn = screen.getByRole('button', { name: 'Cập nhật trạng thái' });
    await user.click(btn);

    expect(screen.getByTestId('status-val')).toHaveTextContent(
      'đang hoạt động',
    );
    expect(queryClient.getQueryData(['admin-status'])).toBe('đang hoạt động');
  });

  it('provides Helmet context allowing child components to set head metadata', () => {
    function HelmetConsumer() {
      return (
        <Helmet>
          <title>Trang Quản Trị Hệ Thống</title>
        </Helmet>
      );
    }

    expect(() => {
      render(
        <AppProviders>
          <HelmetConsumer />
          <div data-testid="helmet-child">Nội dung Helmet</div>
        </AppProviders>,
      );
    }).not.toThrow();

    expect(screen.getByTestId('helmet-child')).toBeInTheDocument();
  });

  it('renders Sonner Toaster with position="top-right", richColors, closeButton and duration=4000', () => {
    render(
      <AppProviders>
        <div>Nội dung</div>
      </AppProviders>,
    );

    const sonner = screen.getByTestId('sonner-toaster');
    expect(sonner).toBeInTheDocument();
    expect(sonner).toHaveAttribute('data-position', 'top-right');
    expect(sonner).toHaveAttribute('data-rich-colors', 'true');
    expect(sonner).toHaveAttribute('data-close-button', 'true');
    expect(sonner).toHaveAttribute('data-duration', '4000');

    expect(Toaster).toHaveBeenCalledWith(
      expect.objectContaining({
        position: 'top-right',
        richColors: true,
        closeButton: true,
        duration: 4000,
      }),
      expect.anything(),
    );
  });

  it('lazy loads and renders ReactQueryDevtools with initialIsOpen={false} in DEV mode', async () => {
    render(
      <AppProviders>
        <div>Nội dung</div>
      </AppProviders>,
    );

    await waitFor(() => {
      const devtools = screen.getByTestId('react-query-devtools');
      expect(devtools).toBeInTheDocument();
      expect(devtools).toHaveAttribute('data-initial-is-open', 'false');
    });
  });

  it('handles component state changes and user events without unmounting providers', async () => {
    function CounterComponent() {
      const [count, setCount] = useState(0);
      return (
        <div>
          <span data-testid="count-text">Số lượng: {count}</span>
          <button onClick={() => setCount((c) => c + 1)}>Tăng số lượng</button>
        </div>
      );
    }

    const user = userEvent.setup();
    render(
      <AppProviders>
        <CounterComponent />
      </AppProviders>,
    );

    expect(screen.getByTestId('count-text')).toHaveTextContent('Số lượng: 0');
    await user.click(screen.getByRole('button', { name: 'Tăng số lượng' }));
    expect(screen.getByTestId('count-text')).toHaveTextContent('Số lượng: 1');
    await user.click(screen.getByRole('button', { name: 'Tăng số lượng' }));
    expect(screen.getByTestId('count-text')).toHaveTextContent('Số lượng: 2');
  });

  it('supports multiple child nodes correctly', () => {
    const { container } = render(
      <AppProviders>
        <header data-testid="header-node">Đầu trang</header>
        <main data-testid="main-node">Thân trang</main>
        <footer data-testid="footer-node">Chân trang</footer>
      </AppProviders>,
    );

    expect(screen.getByTestId('header-node')).toBeInTheDocument();
    expect(screen.getByTestId('main-node')).toBeInTheDocument();
    expect(screen.getByTestId('footer-node')).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it('supports empty or null children without crashing', () => {
    const { container } = render(<AppProviders>{null}</AppProviders>);
    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('session-restore-wrapper')).toBeInTheDocument();
  });

  it('handles production mode where import.meta.env.DEV is falsy', async () => {
    const originalDev = import.meta.env.DEV;
    let canStub = false;
    try {
      Object.defineProperty(import.meta.env, 'DEV', {
        value: false,
        configurable: true,
        writable: true,
      });
      canStub = import.meta.env.DEV === false;
    } catch {
      try {
        (import.meta.env as Record<string, unknown>).DEV = false;
        canStub = import.meta.env.DEV === false;
      } catch {
        canStub = false;
      }
    }

    if (canStub) {
      try {
        vi.resetModules();
        const { AppProviders: ProdAppProviders } = await import('./providers');
        render(
          <ProdAppProviders>
            <div data-testid="prod-child">Nội dung môi trường sản xuất</div>
          </ProdAppProviders>,
        );

        expect(screen.getByTestId('prod-child')).toBeInTheDocument();
        expect(
          screen.queryByTestId('react-query-devtools'),
        ).not.toBeInTheDocument();
      } finally {
        try {
          Object.defineProperty(import.meta.env, 'DEV', {
            value: originalDev,
            configurable: true,
            writable: true,
          });
        } catch {
          (import.meta.env as Record<string, unknown>).DEV = originalDev;
        }
      }
    }
  });
});
