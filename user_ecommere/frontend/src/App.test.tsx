import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';
import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';

vi.mock('./app/providers', () => ({
  AppProviders: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  )),
}));

vi.mock('./app/router', () => ({
  AppRouter: vi.fn(() => (
    <div data-testid="app-router">Hệ thống phân phối xịt thơm</div>
  )),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders AppProviders wrapping AppRouter', () => {
    render(<App />);

    const providersEl = screen.getByTestId('app-providers');
    const routerEl = screen.getByTestId('app-router');

    expect(providersEl).toBeInTheDocument();
    expect(routerEl).toBeInTheDocument();
    expect(providersEl).toContainElement(routerEl);
    expect(AppProviders).toHaveBeenCalledTimes(1);
    expect(AppRouter).toHaveBeenCalledTimes(1);
  });

  it('renders the application router text correctly', () => {
    render(<App />);

    expect(screen.getByText('Hệ thống phân phối xịt thơm')).toBeInTheDocument();
  });

  it('renders with the exact component hierarchy', () => {
    const { container } = render(<App />);

    expect(container.firstChild).toBe(screen.getByTestId('app-providers'));
    expect(screen.getByTestId('app-providers').firstElementChild).toBe(
      screen.getByTestId('app-router'),
    );
  });

  it('passes children to AppProviders correctly', () => {
    render(<App />);

    expect(AppProviders).toHaveBeenCalledWith(
      expect.objectContaining({
        children: expect.anything(),
      }),
      expect.anything(),
    );
  });

  it('supports custom child rendering through AppProviders', () => {
    vi.mocked(AppRouter).mockReturnValueOnce(
      <div data-testid="custom-router-state">
        Trạng thái định tuyến tùy chỉnh
      </div>,
    );

    render(<App />);

    expect(screen.getByTestId('custom-router-state')).toBeInTheDocument();
    expect(
      screen.getByText('Trạng thái định tuyến tùy chỉnh'),
    ).toBeInTheDocument();
  });

  it('renders correctly when AppRouter returns null', () => {
    vi.mocked(AppRouter).mockReturnValueOnce(null as any);

    render(<App />);

    expect(screen.getByTestId('app-providers')).toBeInTheDocument();
    expect(screen.queryByTestId('app-router')).not.toBeInTheDocument();
  });

  it('exports App component as default export', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
