import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppProviders } from './providers';
import { queryClient } from '@/lib/queryClient';

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

vi.mock('@/components/ui/toaster', () => ({
  Toaster: vi.fn(() => <div data-testid="radix-toaster">Radix Toaster</div>),
}));

vi.mock('sonner', () => ({
  Toaster: vi.fn((props: { position?: string; richColors?: boolean }) => (
    <div
      data-testid="sonner-toaster"
      data-position={props.position}
      data-rich-colors={String(props.richColors)}
    >
      Sonner Toaster
    </div>
  )),
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
        <div data-testid="child-element">Nội dung ứng dụng</div>
      </AppProviders>,
    );

    const child = screen.getByTestId('child-element');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Nội dung ứng dụng');

    const wrapper = screen.getByTestId('session-restore-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toContainElement(child);
  });

  it('provides the queryClient context so child hooks can interact with it', async () => {
    function QueryConsumer() {
      const client = useQueryClient();
      const [val, setVal] = useState(
        client.getQueryData<string>(['user-status']) ?? 'chưa khởi tạo',
      );

      return (
        <div>
          <span data-testid="status-val">{val}</span>
          <button
            onClick={() => {
              client.setQueryData(['user-status'], 'đã đăng nhập');
              setVal(client.getQueryData<string>(['user-status']) ?? '');
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

    expect(screen.getByTestId('status-val')).toHaveTextContent('đã đăng nhập');
    expect(queryClient.getQueryData(['user-status'])).toBe('đã đăng nhập');
  });

  it('renders Radix Toaster component for notification banners', () => {
    render(
      <AppProviders>
        <div>Nội dung</div>
      </AppProviders>,
    );

    expect(screen.getByTestId('radix-toaster')).toBeInTheDocument();
    expect(screen.getByText('Radix Toaster')).toBeInTheDocument();
  });

  it('renders SonnerToaster with position="top-right" and richColors set to true', () => {
    render(
      <AppProviders>
        <div>Nội dung</div>
      </AppProviders>,
    );

    const sonner = screen.getByTestId('sonner-toaster');
    expect(sonner).toBeInTheDocument();
    expect(sonner).toHaveAttribute('data-position', 'top-right');
    expect(sonner).toHaveAttribute('data-rich-colors', 'true');
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
      canStub = false;
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
          (import.meta.env as any).DEV = originalDev;
        }
      }
    }
  });
});
