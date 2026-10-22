import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from './form';

beforeEach(() => {
  document.body.style.pointerEvents = 'auto';
});

describe('Form components and useFormField', () => {
  it('has correct displayNames for all form components', () => {
    expect(FormItem.displayName).toBe('FormItem');
    expect(FormLabel.displayName).toBe('FormLabel');
    expect(FormControl.displayName).toBe('FormControl');
    expect(FormDescription.displayName).toBe('FormDescription');
    expect(FormMessage.displayName).toBe('FormMessage');
  });

  it('renders a full form without error and verifies normal state attributes', () => {
    const itemRef = React.createRef<HTMLDivElement>();
    const labelRef = React.createRef<HTMLLabelElement>();
    const controlRef = React.createRef<HTMLInputElement>();
    const descRef = React.createRef<HTMLParagraphElement>();

    const TestForm = () => {
      const form = useForm({
        defaultValues: {
          username: '',
        },
      });

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem ref={itemRef} className="custom-item">
                  <FormLabel ref={labelRef} className="custom-label">
                    Tên đăng nhập
                  </FormLabel>
                  <FormControl ref={controlRef}>
                    <input {...field} placeholder="Nhập tên" />
                  </FormControl>
                  <FormDescription ref={descRef} className="custom-desc">
                    Tối thiểu 3 ký tự
                  </FormDescription>
                  <FormMessage className="custom-msg" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    };

    render(<TestForm />);

    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toHaveClass('space-y-2');
    expect(itemRef.current).toHaveClass('custom-item');

    expect(labelRef.current).toBeInstanceOf(HTMLLabelElement);
    expect(labelRef.current).toHaveClass('custom-label');
    expect(labelRef.current).not.toHaveClass('text-rose-600');

    const input = screen.getByPlaceholderText('Nhập tên');
    expect(controlRef.current).toBe(input);
    expect(input).toHaveAttribute('aria-invalid', 'false');

    expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
    expect(descRef.current).toHaveClass('custom-desc');
    expect(descRef.current).toHaveTextContent('Tối thiểu 3 ký tự');

    // In normal state without error or children, FormMessage returns null
    expect(input).toHaveAttribute('aria-describedby', descRef.current?.id);
    expect(labelRef.current?.htmlFor).toBe(input.id);
  });

  it('renders FormMessage with custom children when there is no error', () => {
    const messageRef = React.createRef<HTMLParagraphElement>();

    const TestForm = () => {
      const form = useForm({
        defaultValues: {
          email: '',
        },
      });

      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <input {...field} />
                </FormControl>
                <FormMessage ref={messageRef} className="custom-msg-fallback">
                  Vui lòng nhập email hợp lệ
                </FormMessage>
              </FormItem>
            )}
          />
        </Form>
      );
    };

    render(<TestForm />);

    expect(messageRef.current).toBeInstanceOf(HTMLParagraphElement);
    expect(messageRef.current).toHaveClass('custom-msg-fallback');
    expect(messageRef.current).toHaveClass('text-rose-600');
    expect(messageRef.current).toHaveTextContent('Vui lòng nhập email hợp lệ');
  });

  it('handles field error states: label styling, aria-invalid, aria-describedby, and FormMessage error body', async () => {
    let setErrorFn: any;
    let clearErrorsFn: any;
    const messageRef = React.createRef<HTMLParagraphElement>();

    const TestForm = () => {
      const form = useForm({
        defaultValues: {
          username: '',
        },
      });
      setErrorFn = form.setError;
      clearErrorsFn = form.clearErrors;

      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-testid="label">Tên tài khoản</FormLabel>
                <FormControl>
                  <input {...field} data-testid="input" />
                </FormControl>
                <FormDescription data-testid="desc">
                  Mô tả tài khoản
                </FormDescription>
                <FormMessage
                  ref={messageRef}
                  className="custom-error-class"
                  data-testid="message"
                >
                  Fallback text khi không có lỗi
                </FormMessage>
              </FormItem>
            )}
          />
        </Form>
      );
    };

    render(<TestForm />);

    const label = screen.getByTestId('label');
    const input = screen.getByTestId('input');
    const desc = screen.getByTestId('desc');

    // Initially without error: fallback text is shown because children were passed
    expect(label).not.toHaveClass('text-rose-600');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveAttribute('aria-describedby', desc.id);
    expect(screen.getByTestId('message')).toHaveTextContent(
      'Fallback text khi không có lỗi',
    );

    // Trigger an error on the field
    act(() => {
      setErrorFn('username', {
        type: 'manual',
        message: 'Tên tài khoản không được để trống',
      });
    });

    const errorMsg = screen.getByTestId('message');
    expect(label).toHaveClass('text-rose-600');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      `${desc.id} ${errorMsg.id}`,
    );
    expect(errorMsg).toHaveTextContent('Tên tài khoản không được để trống');
    expect(errorMsg).toHaveClass('custom-error-class');
    expect(messageRef.current).toBe(errorMsg);

    // Clear the error
    act(() => {
      clearErrorsFn('username');
    });

    expect(label).not.toHaveClass('text-rose-600');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveAttribute('aria-describedby', desc.id);
    expect(screen.getByTestId('message')).toHaveTextContent(
      'Fallback text khi không có lỗi',
    );
  });

  it('exposes all fieldState properties from useFormField hook', () => {
    let capturedField: any;

    const Probe = () => {
      capturedField = useFormField();
      return <div data-testid="probe">{capturedField.name}</div>;
    };

    const TestForm = () => {
      const form = useForm({
        defaultValues: {
          bio: 'Xin chào',
        },
      });

      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="bio"
            render={() => (
              <FormItem>
                <Probe />
              </FormItem>
            )}
          />
        </Form>
      );
    };

    render(<TestForm />);

    expect(capturedField).toBeDefined();
    expect(capturedField.name).toBe('bio');
    expect(capturedField.id).toBeDefined();
    expect(capturedField.formItemId).toBe(`${capturedField.id}-form-item`);
    expect(capturedField.formDescriptionId).toBe(
      `${capturedField.id}-form-item-description`,
    );
    expect(capturedField.formMessageId).toBe(
      `${capturedField.id}-form-item-message`,
    );
    expect(capturedField.invalid).toBe(false);
    expect(capturedField.isDirty).toBe(false);
    expect(capturedField.isTouched).toBe(false);
  });

  it('throws an error when useFormField is called outside <FormField> (!fieldContext)', () => {
    const dummy = FormField({ name: 'test', render: () => null } as any);
    const formFieldContext = (dummy?.type as any)?._context;
    const origValue = formFieldContext?._currentValue;
    if (formFieldContext) {
      formFieldContext._currentValue = false;
      if ('_currentValue2' in formFieldContext) {
        formFieldContext._currentValue2 = false;
      }
    }

    const FaultyComponent = () => {
      useFormField();
      return null;
    };

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      const form = useForm({ defaultValues: { testField: '' } });
      return (
        <Form {...form}>
          {dummy?.type
            ? React.createElement(dummy.type, { value: false as any }, children)
            : children}
        </Form>
      );
    };

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      expect(() =>
        render(
          <Wrapper>
            <FaultyComponent />
          </Wrapper>,
        ),
      ).toThrow('useFormField should be used within <FormField>');
    } finally {
      if (formFieldContext) {
        formFieldContext._currentValue = origValue;
        if ('_currentValue2' in formFieldContext) {
          formFieldContext._currentValue2 = origValue;
        }
      }
      consoleErrorSpy.mockRestore();
    }
  });

  it('handles user typing interaction and value changes through FormField', async () => {
    const user = userEvent.setup();

    const TestForm = () => {
      const form = useForm({
        defaultValues: {
          phone: '',
        },
      });

      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <FormControl>
                  <input {...field} data-testid="phone-input" />
                </FormControl>
              </FormItem>
            )}
          />
        </Form>
      );
    };

    render(<TestForm />);

    const input = screen.getByTestId('phone-input');
    expect(input).toHaveValue('');

    await user.type(input, '0987654321');
    expect(input).toHaveValue('0987654321');
  });
});
