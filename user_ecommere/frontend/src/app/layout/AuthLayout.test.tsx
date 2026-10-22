import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';

afterEach(() => {
  cleanup();
});

function renderAuthLayout(initialRoute = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <div>
                <h1>Đăng nhập tài khoản</h1>
                <Link to="/register">Chuyển sang đăng ký</Link>
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div>
                <h1>Đăng ký tài khoản mới</h1>
                <Link to="/forgot-password">Quên mật khẩu</Link>
              </div>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <div>
                <h1>Khôi phục mật khẩu</h1>
                <Link to="/login">Quay lại đăng nhập</Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthLayout', () => {
  it('renders the container div with dark background styling classes', () => {
    const { container } = renderAuthLayout('/login');

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass(
      'min-h-screen',
      'w-full',
      'bg-[#020617]',
      'text-slate-100',
    );
  });

  it('renders nested child content through Outlet', () => {
    renderAuthLayout('/login');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Đăng nhập tài khoản' }),
    ).toBeInTheDocument();
  });

  it('switches between auth routes when navigation occurs', async () => {
    const user = userEvent.setup();
    renderAuthLayout('/login');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Đăng nhập tài khoản' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Chuyển sang đăng ký' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Đăng ký tài khoản mới' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Quên mật khẩu' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Khôi phục mật khẩu' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Quay lại đăng nhập' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Đăng nhập tài khoản' }),
    ).toBeInTheDocument();
  });
});
