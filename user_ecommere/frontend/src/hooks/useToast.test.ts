import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast as sonner } from 'sonner';
import { useToast } from './useToast';

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('useToast', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let alertSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('maintains stable function references across rerenders', () => {
    const { result, rerender } = renderHook(() => useToast());
    const firstInstance = result.current;

    rerender();

    expect(result.current).toBe(firstInstance);
    expect(result.current.toast).toBe(firstInstance.toast);
    expect(result.current.success).toBe(firstInstance.success);
    expect(result.current.error).toBe(firstInstance.error);
    expect(result.current.warning).toBe(firstInstance.warning);
    expect(result.current.info).toBe(firstInstance.info);
  });

  it('calls sonner.info and does NOT trigger alert or console.log when toast() is called', () => {
    const { result } = renderHook(() => useToast());

    result.current.toast('Thông báo mặc định từ hệ thống');

    expect(sonner.info).toHaveBeenCalledTimes(1);
    expect(sonner.info).toHaveBeenCalledWith('Thông báo mặc định từ hệ thống');
    expect(logSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('calls sonner.info and does NOT trigger alert or console.log when info() is called', () => {
    const { result } = renderHook(() => useToast());

    result.current.info('Cập nhật giỏ hàng thành công');

    expect(sonner.info).toHaveBeenCalledTimes(1);
    expect(sonner.info).toHaveBeenCalledWith('Cập nhật giỏ hàng thành công');
    expect(logSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('calls sonner.success and does NOT trigger alert or console.log when success() is called', () => {
    const { result } = renderHook(() => useToast());

    result.current.success('Đặt hàng thành công! Mã đơn: #DH12345');

    expect(sonner.success).toHaveBeenCalledTimes(1);
    expect(sonner.success).toHaveBeenCalledWith(
      'Đặt hàng thành công! Mã đơn: #DH12345',
    );
    expect(logSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('calls sonner.warning and does NOT trigger alert or console.log when warning() is called', () => {
    const { result } = renderHook(() => useToast());

    result.current.warning('Sản phẩm trong kho chỉ còn lại 2 chai!');

    expect(sonner.warning).toHaveBeenCalledTimes(1);
    expect(sonner.warning).toHaveBeenCalledWith(
      'Sản phẩm trong kho chỉ còn lại 2 chai!',
    );
    expect(logSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('calls sonner.error and does NOT trigger alert dialog or console.log when error() is called', () => {
    const { result } = renderHook(() => useToast());

    const errorMessage =
      'Đăng nhập thất bại. Tài khoản hoặc mật khẩu không chính xác.';
    result.current.error(errorMessage);

    expect(sonner.error).toHaveBeenCalledTimes(1);
    expect(sonner.error).toHaveBeenCalledWith(errorMessage);
    expect(logSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('handles empty string messages across all methods without error', () => {
    const { result } = renderHook(() => useToast());

    result.current.toast('');
    expect(sonner.info).toHaveBeenCalledWith('');

    result.current.info('');
    expect(sonner.info).toHaveBeenCalledWith('');

    result.current.success('');
    expect(sonner.success).toHaveBeenCalledWith('');

    result.current.warning('');
    expect(sonner.warning).toHaveBeenCalledWith('');

    result.current.error('');
    expect(sonner.error).toHaveBeenCalledWith('');

    expect(logSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('handles sequential toast calls correctly', () => {
    const { result } = renderHook(() => useToast());

    result.current.success('Lần 1');
    result.current.error('Lỗi lần 2');
    result.current.warning('Cảnh báo lần 3');

    expect(sonner.success).toHaveBeenCalledWith('Lần 1');
    expect(sonner.error).toHaveBeenCalledWith('Lỗi lần 2');
    expect(sonner.warning).toHaveBeenCalledWith('Cảnh báo lần 3');

    expect(logSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
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
    expect(sonner.info).toHaveBeenCalledWith('Tin tức tổng quát');

    await user.click(screen.getByRole('button', { name: 'Bấm Info' }));
    expect(sonner.info).toHaveBeenCalledWith('Thông tin chi tiết');

    await user.click(screen.getByRole('button', { name: 'Bấm Success' }));
    expect(sonner.success).toHaveBeenCalledWith('Thao tác hoàn tất');

    await user.click(screen.getByRole('button', { name: 'Bấm Warning' }));
    expect(sonner.warning).toHaveBeenCalledWith('Cảnh báo nguy hiểm');

    await user.click(screen.getByRole('button', { name: 'Bấm Error' }));
    expect(sonner.error).toHaveBeenCalledWith('Sự cố hệ thống');

    expect(logSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
