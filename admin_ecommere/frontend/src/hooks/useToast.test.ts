import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast as sonnerToast } from 'sonner';
import { useToast } from './useToast';

vi.mock('sonner', () => {
  const mockSonner = vi.fn();
  (mockSonner as unknown as { success: ReturnType<typeof vi.fn> }).success =
    vi.fn();
  (mockSonner as unknown as { error: ReturnType<typeof vi.fn> }).error =
    vi.fn();
  (mockSonner as unknown as { warning: ReturnType<typeof vi.fn> }).warning =
    vi.fn();
  (mockSonner as unknown as { info: ReturnType<typeof vi.fn> }).info = vi.fn();
  (mockSonner as unknown as { promise: ReturnType<typeof vi.fn> }).promise =
    vi.fn();
  (mockSonner as unknown as { loading: ReturnType<typeof vi.fn> }).loading =
    vi.fn();
  (mockSonner as unknown as { dismiss: ReturnType<typeof vi.fn> }).dismiss =
    vi.fn();

  return {
    toast: mockSonner,
  };
});

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hook methods and delegating to Sonner', () => {
    it('returns all required toast functions and references', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.success).toBe('function');
      expect(typeof result.current.error).toBe('function');
      expect(typeof result.current.warning).toBe('function');
      expect(typeof result.current.info).toBe('function');
      expect(result.current.promise).toBe(sonnerToast.promise);
      expect(result.current.loading).toBe(sonnerToast.loading);
      expect(result.current.dismiss).toBe(sonnerToast.dismiss);
    });

    it('delegates toast() with string message', () => {
      const { result } = renderHook(() => useToast());
      result.current.toast('Thông báo chung');

      expect(sonnerToast).toHaveBeenCalledWith('Thông báo chung');
    });

    it('delegates toast() with ReactNode', () => {
      const { result } = renderHook(() => useToast());
      const customNode = React.createElement(
        'span',
        null,
        'Thông báo tuỳ chỉnh',
      );
      result.current.toast(customNode);

      expect(sonnerToast).toHaveBeenCalledWith(customNode);
    });

    it('delegates success() with string and ReactNode', () => {
      const { result } = renderHook(() => useToast());
      result.current.success('Lưu sản phẩm thành công!');
      expect(sonnerToast.success).toHaveBeenCalledWith(
        'Lưu sản phẩm thành công!',
      );

      const node = React.createElement('strong', null, 'Hoàn thành xuất sắc');
      result.current.success(node);
      expect(sonnerToast.success).toHaveBeenCalledWith(node);
    });

    it('delegates error() with string and ReactNode', () => {
      const { result } = renderHook(() => useToast());
      result.current.error('Đã xảy ra lỗi khi tải dữ liệu');
      expect(sonnerToast.error).toHaveBeenCalledWith(
        'Đã xảy ra lỗi khi tải dữ liệu',
      );

      const node = React.createElement('em', null, 'Lỗi nghiêm trọng');
      result.current.error(node);
      expect(sonnerToast.error).toHaveBeenCalledWith(node);
    });

    it('delegates warning() with string and ReactNode', () => {
      const { result } = renderHook(() => useToast());
      result.current.warning('Số lượng trong kho sắp hết');
      expect(sonnerToast.warning).toHaveBeenCalledWith(
        'Số lượng trong kho sắp hết',
      );

      const node = React.createElement('span', null, 'Cảnh báo hết hạn');
      result.current.warning(node);
      expect(sonnerToast.warning).toHaveBeenCalledWith(node);
    });

    it('delegates info() with string and ReactNode', () => {
      const { result } = renderHook(() => useToast());
      result.current.info('Hệ thống cập nhật lúc 24:00');
      expect(sonnerToast.info).toHaveBeenCalledWith(
        'Hệ thống cập nhật lúc 24:00',
      );

      const node = React.createElement('div', null, 'Thông tin mới');
      result.current.info(node);
      expect(sonnerToast.info).toHaveBeenCalledWith(node);
    });

    it('delegates promise() with promise and options', () => {
      const { result } = renderHook(() => useToast());
      const mockPromise = Promise.resolve('ok');
      const options = {
        loading: 'Đang xử lý...',
        success: 'Thành công!',
        error: 'Thất bại!',
      };

      result.current.promise(mockPromise, options);
      expect(sonnerToast.promise).toHaveBeenCalledWith(mockPromise, options);
    });

    it('delegates loading() with message', () => {
      const { result } = renderHook(() => useToast());
      result.current.loading('Đang tải danh sách đơn hàng...');

      expect(sonnerToast.loading).toHaveBeenCalledWith(
        'Đang tải danh sách đơn hàng...',
      );
    });

    it('delegates dismiss() with and without toast id', () => {
      const { result } = renderHook(() => useToast());
      result.current.dismiss('toast-id-99');
      expect(sonnerToast.dismiss).toHaveBeenCalledWith('toast-id-99');

      result.current.dismiss();
      expect(sonnerToast.dismiss).toHaveBeenCalledWith();
    });

    it('preserves referential stability via useMemo across re-renders', () => {
      const { result, rerender } = renderHook(() => useToast());
      const firstInstance = result.current;

      rerender();
      const secondInstance = result.current;

      expect(firstInstance).toBe(secondInstance);
    });
  });

  describe('component integration and user interactions', () => {
    function ToastTriggerComponent() {
      const toast = useToast();

      return React.createElement(
        'div',
        null,
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => toast.toast('Thông báo mặc định'),
          },
          'Bật toast thường',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => toast.success('Thao tác thành công'),
          },
          'Bật toast thành công',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => toast.error('Có lỗi xảy ra'),
          },
          'Bật toast lỗi',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => toast.warning('Cảnh báo bảo mật'),
          },
          'Bật toast cảnh báo',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => toast.info('Tin tức mới'),
          },
          'Bật toast thông tin',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => toast.loading('Đang thực hiện'),
          },
          'Bật toast loading',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => toast.dismiss('item-1'),
          },
          'Đóng toast',
        ),
      );
    }

    it('triggers toasts on user clicks with exact Vietnamese texts', async () => {
      const user = userEvent.setup();
      render(React.createElement(ToastTriggerComponent));

      await user.click(
        screen.getByRole('button', { name: 'Bật toast thường' }),
      );
      expect(sonnerToast).toHaveBeenCalledWith('Thông báo mặc định');

      await user.click(
        screen.getByRole('button', { name: 'Bật toast thành công' }),
      );
      expect(sonnerToast.success).toHaveBeenCalledWith('Thao tác thành công');

      await user.click(screen.getByRole('button', { name: 'Bật toast lỗi' }));
      expect(sonnerToast.error).toHaveBeenCalledWith('Có lỗi xảy ra');

      await user.click(
        screen.getByRole('button', { name: 'Bật toast cảnh báo' }),
      );
      expect(sonnerToast.warning).toHaveBeenCalledWith('Cảnh báo bảo mật');

      await user.click(
        screen.getByRole('button', { name: 'Bật toast thông tin' }),
      );
      expect(sonnerToast.info).toHaveBeenCalledWith('Tin tức mới');

      await user.click(
        screen.getByRole('button', { name: 'Bật toast loading' }),
      );
      expect(sonnerToast.loading).toHaveBeenCalledWith('Đang thực hiện');

      await user.click(screen.getByRole('button', { name: 'Đóng toast' }));
      expect(sonnerToast.dismiss).toHaveBeenCalledWith('item-1');
    });
  });
});
