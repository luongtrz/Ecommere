import * as React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Label } from './label';

describe('Label', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a label element with children', () => {
    render(<Label>Tên đăng nhập</Label>);
    const label = screen.getByText('Tên đăng nhập');
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');
  });

  it('applies default label variant styles', () => {
    render(<Label>Email</Label>);
    const label = screen.getByText('Email');
    expect(label).toHaveClass(
      'text-sm',
      'font-medium',
      'leading-none',
      'peer-disabled:cursor-not-allowed',
      'peer-disabled:opacity-70',
    );
  });

  it('merges custom className with default styles', () => {
    render(<Label className="custom-label text-red-500">Mật khẩu</Label>);
    const label = screen.getByText('Mật khẩu');
    expect(label).toHaveClass('custom-label', 'text-red-500');
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('renders without custom className (undefined className)', () => {
    render(<Label>Số điện thoại</Label>);
    const label = screen.getByText('Số điện thoại');
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('forwards ref to the underlying label element', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Địa chỉ nhận hàng</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current).toBe(screen.getByText('Địa chỉ nhận hàng'));
  });

  it('associates with an input via htmlFor and focuses input on click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Label htmlFor="address-input">Địa chỉ</Label>
        <input id="address-input" type="text" data-testid="address-input" />
      </div>,
    );
    const label = screen.getByText('Địa chỉ');
    const input = screen.getByTestId('address-input');

    expect(label).toHaveAttribute('for', 'address-input');
    expect(input).not.toHaveFocus();

    await user.click(label);
    expect(input).toHaveFocus();
  });

  it('passes through additional HTML attributes and handles events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Label
        id="label-field-id"
        data-testid="radix-label-attrs"
        aria-label="Nhãn họ tên"
        onClick={handleClick}
      >
        Họ và tên
      </Label>,
    );
    const label = screen.getByTestId('radix-label-attrs');
    expect(label).toHaveAttribute('id', 'label-field-id');
    expect(label).toHaveAttribute('aria-label', 'Nhãn họ tên');

    await user.click(label);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has displayName matching LabelPrimitive.Root.displayName', () => {
    expect(Label.displayName).toBe(LabelPrimitive.Root.displayName);
  });
});
