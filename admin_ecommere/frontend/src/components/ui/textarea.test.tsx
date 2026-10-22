import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders a textarea element with default classes', () => {
    render(<Textarea placeholder="Nhập ghi chú quản trị" />);
    const textarea = screen.getByPlaceholderText('Nhập ghi chú quản trị');

    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveClass(
      'flex',
      'min-h-[80px]',
      'w-full',
      'rounded-lg',
      'border',
      'border-slate-200',
      'bg-white',
      'px-3',
      'py-2',
      'text-sm',
    );
  });

  it('merges custom className with default classes', () => {
    render(
      <Textarea
        className="custom-textarea extra-admin-style"
        data-testid="textarea-custom"
      />,
    );
    const textarea = screen.getByTestId('textarea-custom');

    expect(textarea).toHaveClass(
      'custom-textarea',
      'extra-admin-style',
      'flex',
      'min-h-[80px]',
    );
  });

  it('renders correctly without custom className (undefined className)', () => {
    render(<Textarea data-testid="textarea-undefined" />);
    const textarea = screen.getByTestId('textarea-undefined');

    expect(textarea).toHaveClass('min-h-[80px]');
  });

  it('forwards ref to the underlying HTMLTextAreaElement', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} data-testid="textarea-ref" />);

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toBe(screen.getByTestId('textarea-ref'));

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it('handles user typing and invokes onChange callback', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Textarea onChange={handleChange} placeholder="Nhập mô tả sản phẩm..." />,
    );
    const textarea = screen.getByPlaceholderText('Nhập mô tả sản phẩm...');

    await user.type(textarea, 'Sản phẩm mới');

    expect(textarea).toHaveValue('Sản phẩm mới');
    expect(handleChange).toHaveBeenCalled();
  });

  it('handles controlled value updates', () => {
    const { rerender } = render(
      <Textarea value="Nội dung ban đầu" onChange={() => {}} />,
    );
    const textarea = screen.getByDisplayValue('Nội dung ban đầu');

    expect(textarea).toHaveValue('Nội dung ban đầu');

    rerender(<Textarea value="Nội dung đã sửa" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Nội dung đã sửa')).toHaveValue(
      'Nội dung đã sửa',
    );
  });

  it('handles defaultValue in uncontrolled mode', () => {
    render(<Textarea defaultValue="Giá trị mặc định" />);
    const textarea = screen.getByDisplayValue('Giá trị mặc định');

    expect(textarea).toHaveValue('Giá trị mặc định');
  });

  it('respects the disabled state and prevents user interaction', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Textarea
        disabled
        onChange={handleChange}
        placeholder="Không thể chỉnh sửa"
      />,
    );
    const textarea = screen.getByPlaceholderText('Không thể chỉnh sửa');

    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass(
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
    );

    await user.type(textarea, 'Không thể nhập');
    expect(textarea).toHaveValue('');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('supports readOnly attribute and prevents edits', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Textarea readOnly value="Chỉ xem nội dung" onChange={handleChange} />,
    );
    const textarea = screen.getByDisplayValue('Chỉ xem nội dung');

    expect(textarea).toHaveAttribute('readonly');

    await user.type(textarea, 'Thử gõ');
    expect(textarea).toHaveValue('Chỉ xem nội dung');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('triggers onFocus and onBlur handlers', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(
      <Textarea
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-testid="focus-textarea"
      />,
    );
    const textarea = screen.getByTestId('focus-textarea');

    await user.click(textarea);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('passes through additional HTML attributes', () => {
    render(
      <Textarea
        id="order-notes"
        name="notes"
        rows={4}
        cols={50}
        required
        aria-label="Ghi chú đơn hàng"
        data-testid="textarea-attrs"
      />,
    );
    const textarea = screen.getByTestId('textarea-attrs');

    expect(textarea).toHaveAttribute('id', 'order-notes');
    expect(textarea).toHaveAttribute('name', 'notes');
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('cols', '50');
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('aria-label', 'Ghi chú đơn hàng');
  });

  it('has displayName set to "Textarea"', () => {
    expect(Textarea.displayName).toBe('Textarea');
  });
});
