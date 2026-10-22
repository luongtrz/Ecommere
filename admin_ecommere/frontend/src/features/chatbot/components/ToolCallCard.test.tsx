import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToolCallCardDefault, { ToolCallCard } from './ToolCallCard';
import type { ChatToolStep } from '../types';

describe('ToolCallCard', () => {
  it('exports ToolCallCard as both named and default export', () => {
    expect(ToolCallCard).toBeDefined();
    expect(ToolCallCardDefault).toBeDefined();
    expect(ToolCallCardDefault).toBe(ToolCallCard);
  });

  describe('running status', () => {
    it('renders running status with loader icon, summary, and default running message', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-run-1',
        name: 'search_catalog',
        summary: 'Đang tìm kiếm sản phẩm "laptop"',
        status: 'running',
      };

      const { container } = render(<ToolCallCard step={step} />);

      // Summary text in trigger button
      const trigger = screen.getByRole('button', {
        name: /Đang tìm kiếm sản phẩm "laptop"/i,
      });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('data-state', 'closed');

      // Loader icon verification
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass(
        'animate-spin',
        'text-muted-foreground',
        'h-3.5',
        'w-3.5',
      );
      expect(svg).not.toHaveClass('text-primary');
      expect(svg).not.toHaveClass('text-destructive');

      // Content initially collapsed: Radix unmounts children while closed
      const content = container.querySelector<HTMLDivElement>('div.border-t');
      expect(content).toBeInTheDocument();
      expect(content).toHaveAttribute('data-state', 'closed');
      expect(content).toHaveAttribute('hidden');
      expect(content).not.toBeVisible();
      expect(screen.queryByText('Đang thực hiện…')).toBeNull();

      // Click to expand: children are mounted and visible
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('data-state', 'open');
      expect(content).toHaveAttribute('data-state', 'open');
      expect(content).not.toHaveAttribute('hidden');
      expect(content).toBeVisible();
      expect(screen.getByText('Đang thực hiện…')).toBeVisible();

      // Click to collapse again: content is hidden and unmounted
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('data-state', 'closed');
      expect(content).toHaveAttribute('data-state', 'closed');
      expect(content).not.toBeVisible();
      expect(screen.queryByText('Đang thực hiện…')).toBeNull();
    });

    it('always displays "Đang thực hiện…" even if resultSummary is provided when status is running', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-run-2',
        name: 'query_db',
        summary: 'Đang tổng hợp dữ liệu',
        status: 'running',
        resultSummary: 'Chuỗi kết quả không nên hiển thị',
      };

      render(<ToolCallCard step={step} />);

      const trigger = screen.getByRole('button', {
        name: /Đang tổng hợp dữ liệu/i,
      });
      await user.click(trigger);

      expect(screen.getByText('Đang thực hiện…')).toBeVisible();
      expect(screen.queryByText('Chuỗi kết quả không nên hiển thị')).toBeNull();
    });
  });

  describe('ok status', () => {
    it('renders ok status with check icon, summary, and custom resultSummary', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-ok-1',
        name: 'update_stock',
        summary: 'Cập nhật số lượng tồn kho SP-001',
        status: 'ok',
        resultSummary: 'Đã cập nhật kho: +10 sản phẩm thành công',
      };

      const { container } = render(<ToolCallCard step={step} />);

      const trigger = screen.getByRole('button', {
        name: /Cập nhật số lượng tồn kho SP-001/i,
      });
      expect(trigger).toBeInTheDocument();

      // CheckCircle2 icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-primary', 'h-3.5', 'w-3.5');
      expect(svg).not.toHaveClass('animate-spin');
      expect(svg).not.toHaveClass('text-destructive');

      // Click to expand
      await user.click(trigger);

      const content = screen.getByText(
        'Đã cập nhật kho: +10 sản phẩm thành công',
      );
      expect(content).toBeVisible();
      expect(screen.queryByText('Đang thực hiện…')).toBeNull();
    });

    it('renders ok status with null content when resultSummary is undefined', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-ok-2',
        name: 'ping_service',
        summary: 'Kiểm tra kết nối dịch vụ',
        status: 'ok',
      };

      const { container } = render(<ToolCallCard step={step} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-primary');

      const trigger = screen.getByRole('button', {
        name: /Kiểm tra kết nối dịch vụ/i,
      });
      await user.click(trigger);

      // Collapsible content is rendered but empty
      const content = container.querySelector<HTMLDivElement>('div.border-t');
      expect(content).toBeInTheDocument();
      expect(content?.textContent).toBe('');
      expect(screen.queryByText('Đang thực hiện…')).toBeNull();
    });

    it('renders ok status with null content when resultSummary is explicitly null', async () => {
      const user = userEvent.setup();
      const step = {
        id: 'step-ok-3',
        name: 'null_check',
        summary: 'Kiểm tra null',
        status: 'ok' as const,
        resultSummary: null as unknown as undefined,
      };

      const { container } = render(<ToolCallCard step={step} />);

      const trigger = screen.getByRole('button', {
        name: /Kiểm tra null/i,
      });
      await user.click(trigger);

      const content = container.querySelector<HTMLDivElement>('div.border-t');
      expect(content).toBeInTheDocument();
      expect(content?.textContent).toBe('');
    });
  });

  describe('error status', () => {
    it('renders error status with error icon, summary, and error resultSummary', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-err-1',
        name: 'delete_order',
        summary: 'Xóa đơn hàng #12345',
        status: 'error',
        resultSummary: 'Lỗi: Đơn hàng đã ở trạng thái đã giao, không thể xóa',
      };

      const { container } = render(<ToolCallCard step={step} />);

      const trigger = screen.getByRole('button', {
        name: /Xóa đơn hàng #12345/i,
      });
      expect(trigger).toBeInTheDocument();

      // XCircle icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-destructive', 'h-3.5', 'w-3.5');
      expect(svg).not.toHaveClass('animate-spin');
      expect(svg).not.toHaveClass('text-primary');

      // Click to expand
      await user.click(trigger);

      const content = screen.getByText(
        'Lỗi: Đơn hàng đã ở trạng thái đã giao, không thể xóa',
      );
      expect(content).toBeVisible();
      expect(screen.queryByText('Đang thực hiện…')).toBeNull();
    });

    it('renders error status with null content when resultSummary is undefined', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-err-2',
        name: 'sync_warehouse',
        summary: 'Đồng bộ kho thất bại',
        status: 'error',
      };

      const { container } = render(<ToolCallCard step={step} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-destructive');

      const trigger = screen.getByRole('button', {
        name: /Đồng bộ kho thất bại/i,
      });
      await user.click(trigger);

      const content = container.querySelector<HTMLDivElement>('div.border-t');
      expect(content).toBeInTheDocument();
      expect(content?.textContent).toBe('');
    });
  });

  describe('default export component', () => {
    it('renders identically when using default export', async () => {
      const user = userEvent.setup();
      const step: ChatToolStep = {
        id: 'step-default',
        name: 'backup_database',
        summary: 'Sao lưu dữ liệu hệ thống',
        status: 'ok',
        resultSummary: 'Bản sao lưu lưu tại s3://backups/20261022.sql',
      };

      render(<ToolCallCardDefault step={step} />);

      const trigger = screen.getByRole('button', {
        name: /Sao lưu dữ liệu hệ thống/i,
      });
      expect(trigger).toBeInTheDocument();

      await user.click(trigger);
      expect(
        screen.getByText('Bản sao lưu lưu tại s3://backups/20261022.sql'),
      ).toBeVisible();
    });
  });

  describe('unexpected status handling', () => {
    it('renders no icon when status is not running, ok, or error', async () => {
      const user = userEvent.setup();
      const step = {
        id: 'step-unknown-1',
        name: 'unknown_step',
        summary: 'Trạng thái không xác định',
        status: 'pending' as unknown as 'ok',
        resultSummary: 'Nội dung thông báo chờ',
      };

      const { container } = render(<ToolCallCard step={step} />);

      // No icon rendered
      expect(container.querySelector('svg')).toBeNull();

      // Summary text is rendered
      const trigger = screen.getByRole('button', {
        name: /Trạng thái không xác định/i,
      });
      expect(trigger).toBeInTheDocument();

      // Expand to view resultSummary
      await user.click(trigger);
      expect(screen.getByText('Nội dung thông báo chờ')).toBeVisible();
    });

    it('renders no icon and null content when status is unknown and resultSummary is undefined', async () => {
      const user = userEvent.setup();
      const step = {
        id: 'step-unknown-2',
        name: 'unknown_step_2',
        summary: 'Trạng thái rỗng',
        status: 'queued' as unknown as 'ok',
      };

      const { container } = render(<ToolCallCard step={step} />);

      expect(container.querySelector('svg')).toBeNull();

      const trigger = screen.getByRole('button', {
        name: /Trạng thái rỗng/i,
      });
      await user.click(trigger);

      const content = container.querySelector<HTMLDivElement>('div.border-t');
      expect(content).toBeInTheDocument();
      expect(content?.textContent).toBe('');
    });
  });

  describe('styling classes', () => {
    it('applies the expected Tailwind styling classes to card elements', () => {
      const step: ChatToolStep = {
        id: 'step-style-1',
        name: 'test_style',
        summary: 'Kiểm tra kiểu hiển thị',
        status: 'ok',
        resultSummary: 'Chi tiết kiểu dáng',
      };

      const { container } = render(<ToolCallCard step={step} />);

      // Root Collapsible container
      const root = container.firstElementChild;
      expect(root).toHaveClass(
        'w-full',
        'rounded-xl',
        'border',
        'border-border',
        'bg-card',
        'text-card-foreground',
        'text-xs',
        'overflow-hidden',
        'shadow-sm',
      );

      // Trigger button
      const trigger = screen.getByRole('button', {
        name: /Kiểm tra kiểu hiển thị/i,
      });
      expect(trigger).toHaveClass(
        'flex',
        'w-full',
        'items-center',
        'gap-2',
        'px-3',
        'py-2',
        'text-left',
        'font-medium',
        'hover:bg-muted/50',
        'transition-colors',
      );

      // Summary span
      const summarySpan = screen.getByText('Kiểm tra kiểu hiển thị');
      expect(summarySpan).toHaveClass('flex-1', 'truncate');

      // Collapsible content element
      const content = container.querySelector<HTMLDivElement>('div.border-t');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass(
        'border-t',
        'border-border',
        'px-3',
        'py-2',
        'text-muted-foreground',
        'whitespace-pre-wrap',
        'break-words',
      );
    });
  });
});
