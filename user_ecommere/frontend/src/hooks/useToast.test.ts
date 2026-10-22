import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useToast } from './useToast';

describe('useToast', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let alertSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    alertSpy = vi.fn();
    vi.spyOn(window, 'alert').mockImplementation(alertSpy);
    vi.stubGlobal('alert', alertSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns all expected toast action functions', () => {
    const { result } = renderHook(() => useToast());

    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.success).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.warning).toBe('function');
    expect(typeof result.current.info).toBe('function');
  });

  it('logs [INFO] message and does not trigger alert when toast() is called', () => {
    const { result } = renderHook(() => useToast());

    result.current.toast('Thông báo mặc định từ hệ thống');

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      '[INFO] Thông báo mặc định từ hệ thống',
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('logs [INFO] message and does not trigger alert when info() is called', () => {
    const { result } = renderHook(() => useToast());

    result.current.info('Cập nhật giỏ hàng thành công');

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('[INFO] Cập nhật giỏ hàng thành công');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('logs [SUCCESS] message and does not trigger alert when success() is called', () => {
    const { result } = renderHook(() => useToast());

    result.current.success('Đặt hàng thành công! Mã đơn: #DH12345');

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      '[SUCCESS] Đặt hàng thành công! Mã đơn: #DH12345',
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('logs [WARNING] message and does not trigger alert when warning() is called', () => {
    const { result } = renderHook(() => useToast());

    result.current.warning('Sản phẩm trong kho chỉ còn lại 2 chai!');

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      '[WARNING] Sản phẩm trong kho chỉ còn lại 2 chai!',
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('logs [ERROR] message AND triggers alert dialog when error() is called', () => {
    const { result } = renderHook(() => useToast());

    const errorMessage =
      'Đăng nhập thất bại. Tài khoản hoặc mật khẩu không chính xác.';
    result.current.error(errorMessage);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(`[ERROR] ${errorMessage}`);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(errorMessage);
  });

  it('handles empty string messages across all methods without error', () => {
    const { result } = renderHook(() => useToast());

    result.current.toast('');
    expect(logSpy).toHaveBeenCalledWith('[INFO] ');
    expect(alertSpy).not.toHaveBeenCalled();

    result.current.info('');
    expect(logSpy).toHaveBeenCalledWith('[INFO] ');
    expect(alertSpy).not.toHaveBeenCalled();

    result.current.success('');
    expect(logSpy).toHaveBeenCalledWith('[SUCCESS] ');
    expect(alertSpy).not.toHaveBeenCalled();

    result.current.warning('');
    expect(logSpy).toHaveBeenCalledWith('[WARNING] ');
    expect(alertSpy).not.toHaveBeenCalled();

    result.current.error('');
    expect(logSpy).toHaveBeenCalledWith('[ERROR] ');
    expect(alertSpy).toHaveBeenCalledWith('');
  });

  it('handles sequential toast calls correctly', () => {
    const { result } = renderHook(() => useToast());

    result.current.success('Lần 1');
    result.current.error('Lỗi lần 2');
    result.current.warning('Cảnh báo lần 3');

    expect(logSpy).toHaveBeenCalledTimes(3);
    expect(logSpy).toHaveBeenNthCalledWith(1, '[SUCCESS] Lần 1');
    expect(logSpy).toHaveBeenNthCalledWith(2, '[ERROR] Lỗi lần 2');
    expect(logSpy).toHaveBeenNthCalledWith(3, '[WARNING] Cảnh báo lần 3');

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith('Lỗi lần 2');
  });

  it('renders a component using useToast and triggers toast actions via user clicks', async () => {
    const user = userEvent.setup();

    function NotificationTestComponent() {
      const toast = useToast();

      return React.createElement(
        'div',
        null,
        React.createElement(
          'button',
          { onClick: () => toast.toast('Tin tức tổng quát') },
          'Bấm Toast',
        ),
        React.createElement(
          'button',
          { onClick: () => toast.info('Thông tin chi tiết') },
          'Bấm Info',
        ),
        React.createElement(
          'button',
          { onClick: () => toast.success('Thao tác hoàn tất') },
          'Bấm Success',
        ),
        React.createElement(
          'button',
          { onClick: () => toast.warning('Cảnh báo nguy hiểm') },
          'Bấm Warning',
        ),
        React.createElement(
          'button',
          { onClick: () => toast.error('Sự cố hệ thống') },
          'Bấm Error',
        ),
      );
    }

    render(React.createElement(NotificationTestComponent));

    await user.click(screen.getByRole('button', { name: 'Bấm Toast' }));
    expect(logSpy).toHaveBeenCalledWith('[INFO] Tin tức tổng quát');
    expect(alertSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Bấm Info' }));
    expect(logSpy).toHaveBeenCalledWith('[INFO] Thông tin chi tiết');
    expect(alertSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Bấm Success' }));
    expect(logSpy).toHaveBeenCalledWith('[SUCCESS] Thao tác hoàn tất');
    expect(alertSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Bấm Warning' }));
    expect(logSpy).toHaveBeenCalledWith('[WARNING] Cảnh báo nguy hiểm');
    expect(alertSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Bấm Error' }));
    expect(logSpy).toHaveBeenCalledWith('[ERROR] Sự cố hệ thống');
    expect(alertSpy).toHaveBeenCalledWith('Sự cố hệ thống');
  });
});
