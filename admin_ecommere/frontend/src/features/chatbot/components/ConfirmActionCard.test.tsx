import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmActionCard } from './ConfirmActionCard';
import DefaultConfirmActionCard from './ConfirmActionCard';
import type { ChatConfirmCall } from '../types';

describe('ConfirmActionCard', () => {
  const mockCalls: ChatConfirmCall[] = [
    {
      id: 'call-write',
      name: 'updateProduct',
      summary: 'Cập nhật giá sản phẩm X',
      risk: 'WRITE',
    },
    {
      id: 'call-sensitive',
      name: 'changeRole',
      summary: 'Thay đổi quyền quản trị viên',
      risk: 'SENSITIVE',
    },
    {
      id: 'call-destructive',
      name: 'deleteOrder',
      summary: 'Xóa vĩnh viễn đơn hàng #12345',
      risk: 'DESTRUCTIVE',
    },
  ];

  let onSubmitMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onSubmitMock = vi.fn();
  });

  it('renders correctly with role group, summaries, and risk badges', () => {
    render(<ConfirmActionCard calls={mockCalls} onSubmit={onSubmitMock} />);

    const group = screen.getByRole('group', { name: 'Xác nhận thao tác' });
    expect(group).toBeInTheDocument();

    // Summaries
    expect(screen.getByText('Cập nhật giá sản phẩm X')).toBeInTheDocument();
    expect(
      screen.getByText('Thay đổi quyền quản trị viên'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Xóa vĩnh viễn đơn hàng #12345'),
    ).toBeInTheDocument();

    // Risk badges
    expect(screen.getByText('Thay đổi dữ liệu')).toBeInTheDocument();
    expect(screen.getByText('Cần xác nhận')).toBeInTheDocument();
    expect(screen.getByText('Không thể hoàn tác')).toBeInTheDocument();

    // Action buttons
    expect(
      screen.getByRole('button', { name: 'Xác nhận tất cả' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Từ chối tất cả' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Gửi quyết định' }),
    ).toBeInTheDocument();

    // Submit button should initially be disabled because not all calls are chosen
    expect(
      screen.getByRole('button', { name: 'Gửi quyết định' }),
    ).toBeDisabled();

    // "Đã phản hồi" should not be rendered when decided is false/undefined
    expect(screen.queryByText('Đã phản hồi')).not.toBeInTheDocument();
  });

  it('renders default risk badge when risk is unrecognized or custom', () => {
    const customCall: ChatConfirmCall = {
      id: 'call-custom',
      name: 'customOp',
      summary: 'Thao tác cấu hình hệ thống',
      risk: 'CUSTOM_RISK' as unknown as ChatConfirmCall['risk'],
    };

    render(<ConfirmActionCard calls={[customCall]} onSubmit={onSubmitMock} />);

    expect(screen.getByText('CUSTOM_RISK')).toBeInTheDocument();
  });

  it('handles call with empty string id falling back to index for key', () => {
    const emptyIdCall: ChatConfirmCall = {
      id: '',
      name: 'fallbackId',
      summary: 'Thao tác không có ID định danh',
      risk: 'WRITE',
    };

    render(<ConfirmActionCard calls={[emptyIdCall]} onSubmit={onSubmitMock} />);

    expect(
      screen.getByText('Thao tác không có ID định danh'),
    ).toBeInTheDocument();
  });

  it('disables submit button when calls array is empty', () => {
    render(<ConfirmActionCard calls={[]} onSubmit={onSubmitMock} />);

    const submitBtn = screen.getByRole('button', { name: 'Gửi quyết định' });
    expect(submitBtn).toBeDisabled();
  });

  it('allows user to pick approve or reject for individual calls', async () => {
    const user = userEvent.setup();
    const calls = [mockCalls[0], mockCalls[1]];
    render(<ConfirmActionCard calls={calls} onSubmit={onSubmitMock} />);

    const confirmButtons = screen.getAllByRole('button', { name: 'Xác nhận' });
    const rejectButtons = screen.getAllByRole('button', { name: 'Từ chối' });
    const submitBtn = screen.getByRole('button', { name: 'Gửi quyết định' });

    expect(confirmButtons).toHaveLength(2);
    expect(rejectButtons).toHaveLength(2);
    expect(submitBtn).toBeDisabled();

    // Click confirm on call 0
    await user.click(confirmButtons[0]);
    expect(confirmButtons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(rejectButtons[0]).toHaveAttribute('aria-pressed', 'false');
    // Still disabled because call 1 is not chosen yet
    expect(submitBtn).toBeDisabled();

    // Click reject on call 0 to toggle choice
    await user.click(rejectButtons[0]);
    expect(confirmButtons[0]).toHaveAttribute('aria-pressed', 'false');
    expect(rejectButtons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(submitBtn).toBeDisabled();

    // Click confirm on call 1
    await user.click(confirmButtons[1]);
    expect(confirmButtons[1]).toHaveAttribute('aria-pressed', 'true');
    expect(rejectButtons[1]).toHaveAttribute('aria-pressed', 'false');

    // All chosen now!
    expect(submitBtn).toBeEnabled();
  });

  it('selects all calls as approved when clicking "Xác nhận tất cả"', async () => {
    const user = userEvent.setup();
    render(<ConfirmActionCard calls={mockCalls} onSubmit={onSubmitMock} />);

    const bulkConfirmBtn = screen.getByRole('button', {
      name: 'Xác nhận tất cả',
    });
    await user.click(bulkConfirmBtn);

    const confirmButtons = screen.getAllByRole('button', { name: 'Xác nhận' });
    const rejectButtons = screen.getAllByRole('button', { name: 'Từ chối' });

    for (const btn of confirmButtons) {
      expect(btn).toHaveAttribute('aria-pressed', 'true');
    }
    for (const btn of rejectButtons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    }

    const submitBtn = screen.getByRole('button', { name: 'Gửi quyết định' });
    expect(submitBtn).toBeEnabled();
  });

  it('selects all calls as rejected when clicking "Từ chối tất cả"', async () => {
    const user = userEvent.setup();
    render(<ConfirmActionCard calls={mockCalls} onSubmit={onSubmitMock} />);

    const bulkRejectBtn = screen.getByRole('button', {
      name: 'Từ chối tất cả',
    });
    await user.click(bulkRejectBtn);

    const confirmButtons = screen.getAllByRole('button', { name: 'Xác nhận' });
    const rejectButtons = screen.getAllByRole('button', { name: 'Từ chối' });

    for (const btn of confirmButtons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    }
    for (const btn of rejectButtons) {
      expect(btn).toHaveAttribute('aria-pressed', 'true');
    }

    const submitBtn = screen.getByRole('button', { name: 'Gửi quyết định' });
    expect(submitBtn).toBeEnabled();
  });

  it('submits decisions and handles async Promise onSubmit resolution', async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void = () => {};
    const submitPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    onSubmitMock.mockReturnValue(submitPromise);

    const calls = [mockCalls[0], mockCalls[1]];
    render(<ConfirmActionCard calls={calls} onSubmit={onSubmitMock} />);

    // Choose call 0: approve, call 1: reject
    const confirmButtons = screen.getAllByRole('button', { name: 'Xác nhận' });
    const rejectButtons = screen.getAllByRole('button', { name: 'Từ chối' });
    await user.click(confirmButtons[0]);
    await user.click(rejectButtons[1]);

    const submitBtn = screen.getByRole('button', { name: 'Gửi quyết định' });
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    expect(onSubmitMock).toHaveBeenCalledWith([
      { callId: 'call-write', approve: true },
      { callId: 'call-sensitive', approve: false },
    ]);

    // While submitting, buttons are disabled
    expect(submitBtn).toBeDisabled();
    expect(confirmButtons[0]).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Xác nhận tất cả' }),
    ).toBeDisabled();

    // Resolve promise
    resolvePromise();
    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
  });

  it('catches error and resets submitting when onSubmit promise rejects', async () => {
    const user = userEvent.setup();
    onSubmitMock.mockRejectedValue(new Error('Lỗi gửi quyết định'));

    const calls = [mockCalls[0]];
    render(<ConfirmActionCard calls={calls} onSubmit={onSubmitMock} />);

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    const submitBtn = screen.getByRole('button', { name: 'Gửi quyết định' });
    await user.click(submitBtn);

    expect(onSubmitMock).toHaveBeenCalledWith([
      { callId: 'call-write', approve: true },
    ]);

    // Submitting state should reset after catch block
    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
  });

  it('catches synchronous exception thrown by onSubmit and resets submitting', async () => {
    const user = userEvent.setup();
    onSubmitMock.mockImplementation(() => {
      throw new Error('Lỗi đồng bộ');
    });

    const calls = [mockCalls[0]];
    render(<ConfirmActionCard calls={calls} onSubmit={onSubmitMock} />);

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    const submitBtn = screen.getByRole('button', { name: 'Gửi quyết định' });
    await user.click(submitBtn);

    expect(onSubmitMock).toHaveBeenCalledWith([
      { callId: 'call-write', approve: true },
    ]);

    // Should not throw to caller and reset submitting
    expect(submitBtn).toBeEnabled();
  });

  it('handles synchronous non-promise return from onSubmit', async () => {
    const user = userEvent.setup();
    onSubmitMock.mockReturnValue(undefined);

    const calls = [mockCalls[0]];
    const { rerender } = render(
      <ConfirmActionCard calls={calls} onSubmit={onSubmitMock} />,
    );

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    const submitBtn = screen.getByRole('button', { name: 'Gửi quyết định' });
    await user.click(submitBtn);

    expect(onSubmitMock).toHaveBeenCalledTimes(1);

    // Re-rendering with decided={true} resets submitting
    rerender(
      <ConfirmActionCard
        calls={calls}
        decided={true}
        onSubmit={onSubmitMock}
      />,
    );
    expect(screen.getByText('Đã phản hồi')).toBeInTheDocument();
  });

  it('renders "Đã phản hồi" and disables all buttons when decided is true', () => {
    render(
      <ConfirmActionCard
        calls={mockCalls}
        decided={true}
        onSubmit={onSubmitMock}
      />,
    );

    expect(screen.getByText('Đã phản hồi')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }

    // Clicking buttons when busy does nothing
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận tất cả' }));
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối tất cả' }));
    fireEvent.click(screen.getByRole('button', { name: 'Gửi quyết định' }));

    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it('resets submitting when calls prop changes', () => {
    const calls1 = [mockCalls[0]];
    const calls2 = [mockCalls[1]];

    const { rerender } = render(
      <ConfirmActionCard calls={calls1} onSubmit={onSubmitMock} />,
    );

    // Re-render with new calls
    rerender(<ConfirmActionCard calls={calls2} onSubmit={onSubmitMock} />);

    expect(
      screen.getByText('Thay đổi quyền quản trị viên'),
    ).toBeInTheDocument();
  });

  it('does not submit when not all items are chosen or when disabled', () => {
    render(<ConfirmActionCard calls={mockCalls} onSubmit={onSubmitMock} />);

    const submitBtn = screen.getByRole('button', { name: 'Gửi quyết định' });
    fireEvent.click(submitBtn);

    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it('ignores handleChoice and handleBulk clicks when isBusy is true', () => {
    render(
      <ConfirmActionCard
        calls={mockCalls}
        decided={true}
        onSubmit={onSubmitMock}
      />,
    );

    const confirmButtons = screen.getAllByRole('button', { name: 'Xác nhận' });
    fireEvent.click(confirmButtons[0]);
    expect(confirmButtons[0]).toHaveAttribute('aria-pressed', 'false');

    const bulkConfirmBtn = screen.getByRole('button', {
      name: 'Xác nhận tất cả',
    });
    fireEvent.click(bulkConfirmBtn);
    expect(confirmButtons[0]).toHaveAttribute('aria-pressed', 'false');
  });

  it('works identically via default export', () => {
    render(
      <DefaultConfirmActionCard calls={mockCalls} onSubmit={onSubmitMock} />,
    );

    expect(
      screen.getByRole('group', { name: 'Xác nhận thao tác' }),
    ).toBeInTheDocument();
  });
});
