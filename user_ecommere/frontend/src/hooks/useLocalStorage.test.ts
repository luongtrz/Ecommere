import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    localStorageStore = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return Object.prototype.hasOwnProperty.call(localStorageStore, key)
        ? localStorageStore[key]
        : null;
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        localStorageStore[key] = String(value);
      },
    );

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default value when localStorage has no entry for key', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'giá trị mặc định'),
    );

    expect(result.current[0]).toBe('giá trị mặc định');
    expect(Storage.prototype.getItem).toHaveBeenCalledWith('test-key');
  });

  it('initializes with parsed value when localStorage has existing serialized data', () => {
    const savedUser = { id: 1, name: 'Nguyễn Văn A', roles: ['user'] };
    localStorageStore['user_profile'] = JSON.stringify(savedUser);

    const { result } = renderHook(() =>
      useLocalStorage('user_profile', { id: 0, name: '', roles: [] }),
    );

    expect(result.current[0]).toEqual(savedUser);
    expect(Storage.prototype.getItem).toHaveBeenCalledWith('user_profile');
  });

  it('catches and logs error when localStorage.getItem throws during initialization', () => {
    const getItemError = new Error('Truy cập localStorage bị từ chối');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw getItemError;
    });

    const { result } = renderHook(() =>
      useLocalStorage('error_key', 'dự phòng'),
    );

    expect(result.current[0]).toBe('dự phòng');
    expect(console.error).toHaveBeenCalledWith(getItemError);
  });

  it('catches and logs syntax error when localStorage contains invalid JSON string', () => {
    localStorageStore['corrupted_json'] = 'chuỗi không phải json {';

    const { result } = renderHook(() =>
      useLocalStorage('corrupted_json', 'giá trị an toàn'),
    );

    expect(result.current[0]).toBe('giá trị an toàn');
    expect(console.error).toHaveBeenCalledWith(expect.any(SyntaxError));
  });

  it('updates state and writes serialized value to localStorage when given direct value', () => {
    const { result } = renderHook(() => useLocalStorage('cart_count', 0));

    act(() => {
      result.current[1](5);
    });

    expect(result.current[0]).toBe(5);
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('cart_count', '5');
    expect(localStorageStore['cart_count']).toBe('5');
  });

  it('updates state and writes serialized value when given an updater function', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 10));

    act(() => {
      result.current[1]((prev) => prev + 15);
    });

    expect(result.current[0]).toBe(25);
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('counter', '25');
    expect(localStorageStore['counter']).toBe('25');
  });

  it('supports updater function receiving previous object state', () => {
    interface Settings {
      theme: string;
      notifications: boolean;
    }

    const initialSettings: Settings = { theme: 'light', notifications: true };
    const { result } = renderHook(() =>
      useLocalStorage<Settings>('settings', initialSettings),
    );

    act(() => {
      result.current[1]((prev) => ({ ...prev, theme: 'dark' }));
    });

    expect(result.current[0]).toEqual({ theme: 'dark', notifications: true });
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      'settings',
      JSON.stringify({ theme: 'dark', notifications: true }),
    );
  });

  it('catches and logs error when localStorage.setItem throws in setValue', () => {
    const setItemError = new Error('Vượt quá dung lượng lưu trữ');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw setItemError;
    });

    const { result } = renderHook(() =>
      useLocalStorage('quota_key', 'giá trị đầu'),
    );

    act(() => {
      result.current[1]('dữ liệu lớn');
    });

    expect(console.error).toHaveBeenCalledWith(setItemError);
  });

  it('catches and logs error when updater function throws in setValue', () => {
    const updaterError = new Error('Lỗi trong hàm cập nhật');
    const { result } = renderHook(() =>
      useLocalStorage('updater_error_key', 'an toàn'),
    );

    act(() => {
      result.current[1](() => {
        throw updaterError;
      });
    });

    expect(console.error).toHaveBeenCalledWith(updaterError);
    expect(result.current[0]).toBe('an toàn');
  });

  it('catches and logs error when JSON.stringify fails on circular structures in setValue', () => {
    const circularObj: Record<string, unknown> = { name: 'Vòng lặp' };
    circularObj.self = circularObj;

    const { result } = renderHook(() => useLocalStorage('circular_key', {}));

    act(() => {
      result.current[1](circularObj);
    });

    expect(console.error).toHaveBeenCalledWith(expect.any(TypeError));
  });

  it('handles user interaction and component rendering with state changes', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const [cart, setCart] = useLocalStorage<{ itemsCount: number }>(
        'interactive_cart',
        {
          itemsCount: 1,
        },
      );

      return React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          { 'data-testid': 'cart-count' },
          `Số lượng sản phẩm: ${cart.itemsCount}`,
        ),
        React.createElement(
          'button',
          {
            onClick: () =>
              setCart((prev) => ({
                itemsCount: prev.itemsCount + 1,
              })),
          },
          'Thêm sản phẩm',
        ),
        React.createElement(
          'button',
          { onClick: () => setCart({ itemsCount: 0 }) },
          'Xóa toàn bộ',
        ),
      );
    }

    render(React.createElement(TestComponent));

    const countDisplay = screen.getByTestId('cart-count');
    expect(countDisplay).toHaveTextContent('Số lượng sản phẩm: 1');

    const addButton = screen.getByRole('button', { name: 'Thêm sản phẩm' });
    await user.click(addButton);

    expect(countDisplay).toHaveTextContent('Số lượng sản phẩm: 2');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      'interactive_cart',
      JSON.stringify({ itemsCount: 2 }),
    );

    const clearButton = screen.getByRole('button', { name: 'Xóa toàn bộ' });
    await user.click(clearButton);

    expect(countDisplay).toHaveTextContent('Số lượng sản phẩm: 0');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      'interactive_cart',
      JSON.stringify({ itemsCount: 0 }),
    );
  });
});
