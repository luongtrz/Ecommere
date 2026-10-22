import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

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
    options?: unknown,
  ) => {
    const root = actual.createRoot(container, options as any);
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

vi.mock('./App', () => ({
  default: () => <div data-testid="app-root">Cửa hàng xịt thơm Thái</div>,
}));

vi.mock('react-helmet-async', () => ({
  HelmetProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet-provider">{children}</div>
  ),
}));

describe('main entrypoint', () => {
  beforeEach(() => {
    let root = document.getElementById('root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }
  });

  it('renders App wrapped in HelmetProvider and StrictMode into the root DOM element', async () => {
    await import('./main');

    const root = document.getElementById('root');
    expect(root).not.toBeNull();
    expect(mockCreateRoot).toHaveBeenCalledWith(root);
    expect(mockRender).toHaveBeenCalledTimes(1);

    const renderedTree = mockRender.mock.calls[0][0];
    expect(renderedTree.type).toBe(React.StrictMode);
    expect(renderedTree.props.children.type).toBe(HelmetProvider);
    expect(renderedTree.props.children.props.children.type).toBe(App);

    await waitFor(() => {
      expect(screen.getByTestId('app-root')).toBeInTheDocument();
    });

    expect(screen.getByTestId('helmet-provider')).toBeInTheDocument();
    expect(screen.getByTestId('helmet-provider')).toContainElement(
      screen.getByTestId('app-root'),
    );
    expect(screen.getByText('Cửa hàng xịt thơm Thái')).toBeInTheDocument();
  });

  it('verifies root element contains mounted application markup', () => {
    const root = document.getElementById('root');
    expect(root?.children.length).toBeGreaterThan(0);
    expect(root).toContainElement(screen.getByTestId('app-root'));
  });

  it('verifies mockCreateRoot was invoked with an element having id "root"', () => {
    expect(mockCreateRoot).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'root' }),
    );
  });
});
