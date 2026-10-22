import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './textarea';

afterEach(() => {
  cleanup();
});

describe('Textarea', () => {
  it('renders a textarea element with default classes', () => {
    const { getByTestId } = render(<Textarea data-testid="textarea-default" />);
    const textarea = getByTestId('textarea-default');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveClass(
      'flex',
      'min-h-[80px]',
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

  it('merges custom className with default classes', () => {
    const { getByTestId } = render(
      <Textarea
        className="custom-textarea extra-style"
        data-testid="textarea-custom"
      />,
    );
    const textarea = getByTestId('textarea-custom');
    expect(textarea).toHaveClass('custom-textarea', 'extra-style');
    expect(textarea).toHaveClass('min-h-[80px]');
  });

  it('renders correctly without custom className (undefined className)', () => {
    const { getByTestId } = render(
      <Textarea data-testid="textarea-undefined" />,
    );
    const textarea = getByTestId('textarea-undefined');
    expect(textarea).toHaveClass('min-h-[80px]');
  });

  it('forwards ref to the underlying HTMLTextAreaElement', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    const { getByTestId } = render(
      <Textarea ref={ref} data-testid="textarea-ref" />,
    );
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toBe(getByTestId('textarea-ref'));
  });

  it('handles user typing and invokes onChange callback', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { getByPlaceholderText } = render(
      <Textarea onChange={handleChange} placeholder="Nhập ghi chú..." />,
    );

    const textarea = getByPlaceholderText('Nhập ghi chú...');
    await user.type(textarea, 'Test message');

    expect(textarea).toHaveValue('Test message');
    expect(handleChange).toHaveBeenCalled();
  });

  it('respects the disabled state and prevents user interaction', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { getByPlaceholderText } = render(
      <Textarea
        disabled
        onChange={handleChange}
        placeholder="Không thể chỉnh sửa"
      />,
    );

    const textarea = getByPlaceholderText('Không thể chỉnh sửa');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass(
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
    );

    await user.type(textarea, 'Should not type');
    expect(textarea).toHaveValue('');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders with defaultValue and value props properly', () => {
    const { getByTestId, unmount } = render(
      <Textarea
        defaultValue="Nội dung ban đầu"
        data-testid="textarea-default-val"
      />,
    );
    expect(getByTestId('textarea-default-val')).toHaveValue('Nội dung ban đầu');
    unmount();

    const { getByTestId: getByTestIdControlled } = render(
      <Textarea
        value="Nội dung cố định"
        onChange={() => {}}
        data-testid="textarea-controlled-val"
      />,
    );
    expect(getByTestIdControlled('textarea-controlled-val')).toHaveValue(
      'Nội dung cố định',
    );
  });

  it('passes through additional HTML attributes', () => {
    const { getByTestId } = render(
      <Textarea
        id="textarea-id"
        name="notes"
        rows={4}
        required
        aria-label="Ghi chú đơn hàng"
        data-testid="textarea-attrs"
      />,
    );
    const textarea = getByTestId('textarea-attrs');
    expect(textarea).toHaveAttribute('id', 'textarea-id');
    expect(textarea).toHaveAttribute('name', 'notes');
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('aria-label', 'Ghi chú đơn hàng');
  });

  it('has displayName set to Textarea', () => {
    expect(Textarea.displayName).toBe('Textarea');
  });
});
