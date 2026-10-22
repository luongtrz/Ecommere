import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolCallCard } from './ToolCallCard';
import ToolCallCardDefault from './ToolCallCard';
import type { ChatToolStep } from '../types';

describe('ToolCallCard', () => {
  it('exports ToolCallCard as named export and default export', () => {
    expect(ToolCallCard).toBeDefined();
    expect(ToolCallCardDefault).toBe(ToolCallCard);
  });

  describe('running state', () => {
    it('renders spinning loader, summary, and "Đang thực hiện…" in content', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-1',
        name: 'search_products',
        summary: 'Đang tìm kiếm sản phẩm...',
        status: 'running',
      };

      const { container } = render(<ToolCallCard step={step} />);

      expect(screen.getByText('Đang tìm kiếm sản phẩm...')).toBeInTheDocument();

      const loaderIcon = container.querySelector('svg.animate-spin');
      expect(loaderIcon).toBeInTheDocument();
      expect(loaderIcon).toHaveClass('h-3.5', 'w-3.5', 'text-teal-600');

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Đang thực hiện…')).toBeInTheDocument();
    });

    it('renders "Đang thực hiện…" even if resultSummary is provided when status is running', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-run-2',
        name: 'checkout',
        summary: 'Đang xử lý đơn hàng',
        status: 'running',
        resultSummary: 'Kết quả tạm không được hiển thị khi running',
      };

      render(<ToolCallCard step={step} />);
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(screen.getByText('Đang thực hiện…')).toBeInTheDocument();
      expect(
        screen.queryByText('Kết quả tạm không được hiển thị khi running'),
      ).not.toBeInTheDocument();
    });
  });

  describe('ok state', () => {
    it('renders check icon and resultSummary when provided', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-2',
        name: 'cart_add_item',
        summary: 'Thêm vào giỏ hàng',
        status: 'ok',
        resultSummary: 'Đã thêm 1 sản phẩm vào giỏ hàng.',
      };

      const { container } = render(<ToolCallCard step={step} />);

      expect(screen.getByText('Thêm vào giỏ hàng')).toBeInTheDocument();

      const checkIcon = container.querySelector('svg.text-emerald-600');
      expect(checkIcon).toBeInTheDocument();
      expect(checkIcon).toHaveClass('h-3.5', 'w-3.5');

      expect(
        container.querySelector('svg.animate-spin'),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector('svg.text-rose-600'),
      ).not.toBeInTheDocument();

      const trigger = screen.getByRole('button');
      await user.click(trigger);
      expect(
        screen.getByText('Đã thêm 1 sản phẩm vào giỏ hàng.'),
      ).toBeInTheDocument();
    });

    it('renders null content when resultSummary is undefined in ok status', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-3',
        name: 'cart_clear',
        summary: 'Xóa toàn bộ giỏ hàng',
        status: 'ok',
      };

      const { container } = render(<ToolCallCard step={step} />);

      expect(screen.getByText('Xóa toàn bộ giỏ hàng')).toBeInTheDocument();
      expect(container.querySelector('svg.text-emerald-600')).toBeInTheDocument();

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.queryByText('Đang thực hiện…')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error icon and error resultSummary when provided', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-4',
        name: 'checkout',
        summary: 'Thanh toán thất bại',
        status: 'error',
        resultSummary: 'Số dư không đủ để thực hiện giao dịch.',
      };

      const { container } = render(<ToolCallCard step={step} />);

      expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument();

      const errorIcon = container.querySelector('svg.text-rose-600');
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveClass('h-3.5', 'w-3.5');

      const trigger = screen.getByRole('button');
      await user.click(trigger);
      expect(
        screen.getByText('Số dư không đủ để thực hiện giao dịch.'),
      ).toBeInTheDocument();
    });

    it('renders null content when resultSummary is undefined in error status', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-5',
        name: 'cancel_my_order',
        summary: 'Hủy đơn hàng không thành công',
        status: 'error',
      };

      const { container } = render(<ToolCallCard step={step} />);

      expect(
        screen.getByText('Hủy đơn hàng không thành công'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('svg.text-rose-600'),
      ).toBeInTheDocument();

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.queryByText('Đang thực hiện…')).not.toBeInTheDocument();
    });
  });

  describe('interaction and default export', () => {
    it('toggles open and closed when clicked multiple times', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-toggle',
        name: 'get_referral_info',
        summary: 'Lấy mã giới thiệu',
        status: 'ok',
        resultSummary: 'Mã của bạn: REF123',
      };

      render(<ToolCallCard step={step} />);
      const trigger = screen.getByRole('button');

      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Mã của bạn: REF123')).toBeInTheDocument();

      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders correctly with default export', () => {
      const step: ChatToolStep = {
        id: 'step-default',
        name: 'default_test',
        summary: 'Thử nghiệm default export',
        status: 'ok',
        resultSummary: 'Thành công',
      };

      render(<ToolCallCardDefault step={step} />);
      expect(screen.getByText('Thử nghiệm default export')).toBeInTheDocument();
    });

    it('handles unexpected status fallback gracefully without crashing or icons', async () => {
      const user = userEvent.setup();
      const step = {
        id: 'step-unknown',
        name: 'unknown_step',
        summary: 'Trạng thái lạ',
        status: 'idle' as unknown as ChatToolStep['status'],
        resultSummary: 'Chi tiết trạng thái lạ',
      };

      const { container } = render(<ToolCallCard step={step} />);

      expect(screen.getByText('Trạng thái lạ')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeNull();

      const trigger = screen.getByRole('button');
      await user.click(trigger);
      expect(screen.getByText('Chi tiết trạng thái lạ')).toBeInTheDocument();
    });
  });
});
