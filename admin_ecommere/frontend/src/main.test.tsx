import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { router } from './app/router';

let rootElement = document.getElementById('root');
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

const mockRender = vi.fn();
const mockCreateRoot = vi.fn();

vi.mock('react-dom/client', async (importOriginal) => {
  const actual =
    typeof importOriginal === 'function'
      ? await importOriginal<typeof import('react-dom/client')>()
      : await vi.importActual<typeof import('react-dom/client')>(
          'react-dom/client',
        );

  const customCreateRoot = (
    container: Element | DocumentFragment,
    options?: Parameters<typeof actual.createRoot>[1],
  ) => {
    const root = actual.createRoot(container, options);
    mockCreateRoot(container);
    const originalRender = root.render.bind(root);
    root.render = (children: React.ReactNode) => {
      mockRender(children);
      return originalRender(children);
    };
    return root;
  };

  return {
    ...actual,
    default: {
      ...actual,
      createRoot: customCreateRoot,
    },
    createRoot: customCreateRoot,
  };
});

vi.mock('./app/providers', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  ),
}));

vi.mock('./app/router', () => ({
  router: { id: 'mock-admin-router' },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual =
    typeof importOriginal === 'function'
      ? await importOriginal<typeof import('react-router-dom')>()
      : await vi.importActual<typeof import('react-router-dom')>(
          'react-router-dom',
        );

  return {
    ...actual,
    RouterProvider: ({
      router,
    }: React.ComponentProps<typeof actual.RouterProvider>) => (
      <div
        data-testid="router-provider"
        data-has-router={String(Boolean(router))}
      >
        Trang quản trị hệ thống
      </div>
    ),
  };
});

describe('main entrypoint', () => {
  beforeEach(() => {
    let root = document.getElementById('root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }
  });

  it('renders AppProviders and RouterProvider in StrictMode into the root DOM element', async () => {
    await import('./main');

    const root = document.getElementById('root');
    expect(root).not.toBeNull();
    expect(mockCreateRoot).toHaveBeenCalledWith(root);
    expect(mockRender).toHaveBeenCalledTimes(1);

    const renderedTree = mockRender.mock.calls[0][0];
    expect(renderedTree.type).toBe(React.StrictMode);
    expect(renderedTree.props.children.type).toBe(AppProviders);
    expect(renderedTree.props.children.props.children.type).toBe(
      RouterProvider,
    );
    expect(renderedTree.props.children.props.children.props.router).toBe(
      router,
    );

    await waitFor(() => {
      expect(screen.getByTestId('app-providers')).toBeInTheDocument();
    });

    expect(screen.getByTestId('router-provider')).toBeInTheDocument();
    expect(screen.getByTestId('app-providers')).toContainElement(
      screen.getByTestId('router-provider'),
    );
    expect(screen.getByText('Trang quản trị hệ thống')).toBeInTheDocument();
  });

  it('verifies root element contains mounted application markup', () => {
    const root = document.getElementById('root');
    expect(root?.children.length).toBeGreaterThan(0);
    expect(root).toContainElement(screen.getByTestId('app-providers'));
  });

  it('verifies mockCreateRoot was invoked with an element having id "root"', () => {
    expect(mockCreateRoot).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'root' }),
    );
  });
});
