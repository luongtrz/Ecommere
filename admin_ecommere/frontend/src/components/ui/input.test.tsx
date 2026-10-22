import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('renders standard input element with default classes', () => {
    render(<Input placeholder="Nhập tên người dùng" />);
    const input = screen.getByPlaceholderText('Nhập tên người dùng');

    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-background',
      'px-3',
      'py-2',
      'text-sm',
    );
  });

  it('renders with type="text"', () => {
    render(<Input type="text" data-testid="text-input" />);
    const input = screen.getByTestId('text-input');

    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders with type="password"', () => {
    render(<Input type="password" data-testid="password-input" />);
    const input = screen.getByTestId('password-input');

    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders with type="email"', () => {
    render(<Input type="email" data-testid="email-input" />);
    const input = screen.getByTestId('email-input');

    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders with type="number" and number attributes', () => {
    render(
      <Input
        type="number"
        min={1}
        max={100}
        step={5}
        data-testid="number-input"
      />,
    );
    const input = screen.getByTestId('number-input');

    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '5');
  });

  it('renders with type="file"', () => {
    render(<Input type="file" data-testid="file-input" />);
    const input = screen.getByTestId('file-input');

    expect(input).toHaveAttribute('type', 'file');
  });

  it('merges custom className with default classes', () => {
    render(
      <Input
        className="custom-admin-input bg-muted"
        data-testid="custom-input"
      />,
    );
    const input = screen.getByTestId('custom-input');

    expect(input).toHaveClass('custom-admin-input', 'bg-muted', 'flex', 'h-10');
  });

  it('handles user typing interaction', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input placeholder="Nhập địa chỉ" onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Nhập địa chỉ');

    await user.type(input, 'Hà Nội');

    expect(input).toHaveValue('Hà Nội');
    expect(handleChange).toHaveBeenCalledTimes(6);
  });

  it('handles controlled value updates', () => {
    const { rerender } = render(
      <Input value="Giá trị cũ" onChange={() => {}} />,
    );
    const input = screen.getByDisplayValue('Giá trị cũ');

    expect(input).toHaveValue('Giá trị cũ');

    rerender(<Input value="Giá trị mới" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Giá trị mới')).toHaveValue('Giá trị mới');
  });

  it('handles defaultValue in uncontrolled mode', () => {
    render(<Input defaultValue="Mặc định ban đầu" />);
    const input = screen.getByDisplayValue('Mặc định ban đầu');

    expect(input).toHaveValue('Mặc định ban đầu');
  });

  it('supports disabled state and prevents user typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Input disabled placeholder="Không thể nhập" onChange={handleChange} />,
    );
    const input = screen.getByPlaceholderText('Không thể nhập');

    expect(input).toBeDisabled();
    expect(input).toHaveClass(
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
    );

    await user.type(input, 'thử nhập');
    expect(handleChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  it('supports readOnly attribute', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input readOnly value="Chỉ được xem" onChange={handleChange} />);
    const input = screen.getByDisplayValue('Chỉ được xem');

    expect(input).toHaveAttribute('readonly');
    await user.type(input, 'thêm text');
    expect(handleChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('Chỉ được xem');
  });

  it('triggers onFocus and onBlur handlers', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(
      <Input
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-testid="focus-input"
      />,
    );
    const input = screen.getByTestId('focus-input');

    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the HTMLInputElement', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} data-testid="ref-input" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByTestId('ref-input'));

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it('forwards additional HTML attributes correctly', () => {
    render(
      <Input
        id="admin-email"
        name="email"
        autoComplete="email"
        required
        aria-label="Email quản trị viên"
        aria-required="true"
        data-testid="admin-email-input"
      />,
    );
    const input = screen.getByTestId('admin-email-input');

    expect(input).toHaveAttribute('id', 'admin-email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-label', 'Email quản trị viên');
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('has displayName set to "Input"', () => {
    expect(Input.displayName).toBe('Input');
  });
});
