import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Label } from './label';

afterEach(() => {
  cleanup();
});

describe('Label', () => {
  it('renders a label element with children', () => {
    const { getByText } = render(<Label>Tên đăng nhập</Label>);
    const label = getByText('Tên đăng nhập');
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');
  });

  it('applies default label variant styles', () => {
    const { getByText } = render(<Label>Email</Label>);
    const label = getByText('Email');
    expect(label).toHaveClass(
      'text-sm',
      'font-medium',
      'leading-none',
      'peer-disabled:cursor-not-allowed',
      'peer-disabled:opacity-70',
    );
  });

  it('merges custom className with default styles', () => {
    const { getByText } = render(
      <Label className="custom-label text-red-500">Mật khẩu</Label>,
    );
    const label = getByText('Mật khẩu');
    expect(label).toHaveClass('custom-label', 'text-red-500');
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('renders without custom className (undefined className)', () => {
    const { getByText } = render(<Label>Số điện thoại</Label>);
    const label = getByText('Số điện thoại');
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('forwards ref to the underlying label element', () => {
    const ref = React.createRef<HTMLLabelElement>();
    const { getByText } = render(<Label ref={ref}>Địa chỉ nhận hàng</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current).toBe(getByText('Địa chỉ nhận hàng'));
  });

  it('associates with an input via htmlFor and focuses input on click', async () => {
    const user = userEvent.setup();
    const { getByText, getByTestId } = render(
      <div>
        <Label htmlFor="address-input">Địa chỉ</Label>
        <input id="address-input" type="text" data-testid="address-input" />
      </div>,
    );
    const label = getByText('Địa chỉ');
    const input = getByTestId('address-input');

    expect(label).toHaveAttribute('for', 'address-input');
    expect(input).not.toHaveFocus();

    await user.click(label);
    expect(input).toHaveFocus();
  });

  it('passes through additional HTML attributes', () => {
    const { getByTestId } = render(
      <Label
        id="label-field-id"
        data-testid="radix-label-attrs"
        aria-label="Nhãn họ tên"
      >
        Họ và tên
      </Label>,
    );
    const label = getByTestId('radix-label-attrs');
    expect(label).toHaveAttribute('id', 'label-field-id');
    expect(label).toHaveAttribute('aria-label', 'Nhãn họ tên');
  });

  it('has displayName matching LabelPrimitive.Root.displayName', () => {
    expect(Label.displayName).toBe(LabelPrimitive.Root.displayName);
  });
});
