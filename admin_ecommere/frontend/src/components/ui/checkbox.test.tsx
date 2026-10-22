import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  beforeEach(() => {
    if (!globalThis.ResizeObserver) {
      globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));
    }
  });

  it('renders unchecked by default with default styling classes', () => {
    render(<Checkbox aria-label="Ghi nhớ đăng nhập" />);
    const checkbox = screen.getByRole('checkbox', {
      name: 'Ghi nhớ đăng nhập',
    });

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    expect(checkbox.querySelector('svg')).toBeNull();
    expect(checkbox).toHaveClass(
      'peer',
      'h-4',
      'w-4',
      'shrink-0',
      'rounded-sm',
      'border',
      'border-primary',
    );
  });

  it('renders checked when defaultChecked is true', () => {
    render(<Checkbox defaultChecked aria-label="Đồng ý điều khoản" />);
    const checkbox = screen.getByRole('checkbox', {
      name: 'Đồng ý điều khoản',
    });

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    expect(checkbox.querySelector('svg')).toBeInTheDocument();
  });

  it('renders controlled checked state properly', () => {
    const { rerender } = render(
      <Checkbox
        checked={false}
        aria-label="Nhận thông báo"
        onCheckedChange={() => {}}
      />,
    );
    let checkbox = screen.getByRole('checkbox', { name: 'Nhận thông báo' });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox.querySelector('svg')).toBeNull();

    rerender(
      <Checkbox
        checked={true}
        aria-label="Nhận thông báo"
        onCheckedChange={() => {}}
      />,
    );
    checkbox = screen.getByRole('checkbox', { name: 'Nhận thông báo' });
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox.querySelector('svg')).toBeInTheDocument();
  });

  it('renders indeterminate state when checked="indeterminate"', () => {
    render(
      <Checkbox
        checked="indeterminate"
        aria-label="Chọn tất cả"
        onCheckedChange={() => {}}
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Chọn tất cả' });

    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    expect(checkbox.querySelector('svg')).toBeInTheDocument();
  });

  it('toggles state on user click when uncontrolled', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Bật tính năng" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Bật tính năng' });

    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox.querySelector('svg')).toBeNull();

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    expect(checkbox.querySelector('svg')).toBeInTheDocument();

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    expect(checkbox.querySelector('svg')).toBeNull();
  });

  it('toggles state via keyboard Space key', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Thao tác phím" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Thao tác phím' });

    checkbox.focus();
    expect(checkbox).toHaveFocus();

    await user.keyboard(' ');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    await user.keyboard(' ');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onCheckedChange when clicked in controlled mode', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(
      <Checkbox
        checked={false}
        onCheckedChange={handleCheckedChange}
        aria-label="Xác nhận"
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Xác nhận' });

    await user.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle or trigger onCheckedChange when disabled', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(
      <Checkbox
        disabled
        onCheckedChange={handleCheckedChange}
        aria-label="Tùy chọn vô hiệu"
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Tùy chọn vô hiệu' });

    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAttribute('data-disabled');

    await user.click(checkbox);
    expect(handleCheckedChange).not.toHaveBeenCalled();
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('merges custom className with default classes', () => {
    render(
      <Checkbox
        className="custom-check-class m-2"
        aria-label="Tùy chỉnh class"
      />,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Tùy chỉnh class' });

    expect(checkbox).toHaveClass('custom-check-class', 'm-2', 'h-4', 'w-4');
  });

  it('forwards ref to the underlying button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} aria-label="Kiểm tra ref" />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(
      screen.getByRole('checkbox', { name: 'Kiểm tra ref' }),
    );
  });

  it('forwards additional HTML and Radix props', () => {
    render(
      <Checkbox
        id="policy-checkbox"
        value="agree"
        required
        data-testid="policy-cb"
        aria-label="Chính sách bảo mật"
        data-custom="policy-custom"
        title="Tiêu đề chính sách"
      />,
    );
    const checkbox = screen.getByTestId('policy-cb');

    expect(checkbox).toHaveAttribute('id', 'policy-checkbox');
    expect(checkbox).toHaveAttribute('value', 'agree');
    expect(checkbox).toHaveAttribute('data-custom', 'policy-custom');
    expect(checkbox).toHaveAttribute('title', 'Tiêu đề chính sách');
    expect(checkbox).toBeRequired();
  });

  it('has the displayName matching CheckboxPrimitive.Root.displayName', () => {
    expect(Checkbox.displayName).toBe(CheckboxPrimitive.Root.displayName);
  });
});
