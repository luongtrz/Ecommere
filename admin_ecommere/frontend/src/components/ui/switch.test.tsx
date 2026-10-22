import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { Switch } from './switch';

describe('Switch', () => {
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
    render(
      <Switch aria-label="Kích hoạt tính năng" data-testid="switch-root" />,
    );
    const switchElement = screen.getByRole('switch', {
      name: 'Kích hoạt tính năng',
    });

    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    expect(switchElement).toHaveClass(
      'peer',
      'inline-flex',
      'h-6',
      'w-11',
      'shrink-0',
      'cursor-pointer',
      'items-center',
      'rounded-full',
      'border-2',
      'border-transparent',
    );

    const thumb = switchElement.querySelector('span');
    expect(thumb).toBeInTheDocument();
    expect(thumb).toHaveAttribute('data-state', 'unchecked');
    expect(thumb).toHaveClass(
      'pointer-events-none',
      'block',
      'h-5',
      'w-5',
      'rounded-full',
      'bg-background',
    );
  });

  it('renders checked when defaultChecked is true', () => {
    render(
      <Switch
        defaultChecked
        aria-label="Tự động cập nhật"
        data-testid="switch-checked"
      />,
    );
    const switchElement = screen.getByRole('switch', {
      name: 'Tự động cập nhật',
    });

    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
    expect(switchElement).toHaveAttribute('data-state', 'checked');

    const thumb = switchElement.querySelector('span');
    expect(thumb).toBeInTheDocument();
    expect(thumb).toHaveAttribute('data-state', 'checked');
  });

  it('renders controlled checked state properly', () => {
    const { rerender } = render(
      <Switch
        checked={false}
        aria-label="Thông báo hệ thống"
        onCheckedChange={() => {}}
      />,
    );
    let switchElement = screen.getByRole('switch', {
      name: 'Thông báo hệ thống',
    });
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');

    rerender(
      <Switch
        checked={true}
        aria-label="Thông báo hệ thống"
        onCheckedChange={() => {}}
      />,
    );
    switchElement = screen.getByRole('switch', {
      name: 'Thông báo hệ thống',
    });
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('toggles state on user click when uncontrolled', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Bật chế độ bảo trì" />);
    const switchElement = screen.getByRole('switch', {
      name: 'Bật chế độ bảo trì',
    });

    expect(switchElement).toHaveAttribute('aria-checked', 'false');

    await user.click(switchElement);
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
    expect(switchElement).toHaveAttribute('data-state', 'checked');

    await user.click(switchElement);
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
  });

  it('toggles state via keyboard Space key', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Thao tác bàn phím" />);
    const switchElement = screen.getByRole('switch', {
      name: 'Thao tác bàn phím',
    });

    switchElement.focus();
    expect(switchElement).toHaveFocus();

    await user.keyboard(' ');
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
    expect(switchElement).toHaveAttribute('data-state', 'checked');

    await user.keyboard(' ');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
  });

  it('calls onCheckedChange callback with expected arguments', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    const { rerender } = render(
      <Switch
        checked={false}
        onCheckedChange={handleCheckedChange}
        aria-label="Đồng bộ dữ liệu"
      />,
    );
    const switchElement = screen.getByRole('switch', {
      name: 'Đồng bộ dữ liệu',
    });

    await user.click(switchElement);
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);

    rerender(
      <Switch
        checked={true}
        onCheckedChange={handleCheckedChange}
        aria-label="Đồng bộ dữ liệu"
      />,
    );

    await user.click(switchElement);
    expect(handleCheckedChange).toHaveBeenCalledTimes(2);
    expect(handleCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it('does not toggle or call onCheckedChange when disabled', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(
      <Switch
        disabled
        onCheckedChange={handleCheckedChange}
        aria-label="Tùy chọn vô hiệu"
      />,
    );
    const switchElement = screen.getByRole('switch', {
      name: 'Tùy chọn vô hiệu',
    });

    expect(switchElement).toBeDisabled();
    expect(switchElement).toHaveAttribute('data-disabled');

    await user.click(switchElement);
    expect(handleCheckedChange).not.toHaveBeenCalled();
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
  });

  it('merges custom className with default classes', () => {
    render(
      <Switch
        className="custom-switch-class my-custom-class"
        aria-label="Tùy chỉnh giao diện"
      />,
    );
    const switchElement = screen.getByRole('switch', {
      name: 'Tùy chỉnh giao diện',
    });

    expect(switchElement).toHaveClass(
      'custom-switch-class',
      'my-custom-class',
      'inline-flex',
      'h-6',
      'w-11',
    );
  });

  it('forwards ref to the underlying button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch ref={ref} aria-label="Kiểm tra ref" />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(
      screen.getByRole('switch', { name: 'Kiểm tra ref' }),
    );
  });

  it('forwards additional HTML and Radix attributes', () => {
    render(
      <Switch
        id="feature-flag"
        name="feature_flag"
        value="enabled"
        required
        data-testid="switch-attrs"
        aria-label="Cờ tính năng"
        title="Tiêu đề tính năng"
      />,
    );
    const switchElement = screen.getByTestId('switch-attrs');

    expect(switchElement).toHaveAttribute('id', 'feature-flag');
    expect(switchElement).toHaveAttribute('value', 'enabled');
    expect(switchElement).toHaveAttribute('title', 'Tiêu đề tính năng');
    expect(switchElement).toHaveAttribute('aria-label', 'Cờ tính năng');
  });

  it('has displayName matching SwitchPrimitives.Root.displayName', () => {
    expect(Switch.displayName).toBe(SwitchPrimitives.Root.displayName);
  });
});
