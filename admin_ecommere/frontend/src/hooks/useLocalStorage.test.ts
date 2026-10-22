import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  let mockStore: Record<string, string> = {};

  const mockGetItem = vi.fn((key: string): string | null => {
    return mockStore[key] ?? null;
  });

  const mockSetItem = vi.fn((key: string, value: string): void => {
    mockStore[key] = String(value);
  });

  const localStorageMock = {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: vi.fn((key: string): void => {
      delete mockStore[key];
    }),
    clear: vi.fn((): void => {
      mockStore = {};
    }),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  Storage.prototype.getItem = mockGetItem;
  Storage.prototype.setItem = mockSetItem;

  beforeEach(() => {
    mockStore = {};
    vi.clearAllMocks();
    mockGetItem.mockImplementation((key: string) => mockStore[key] ?? null);
    mockSetItem.mockImplementation((key: string, value: string) => {
      mockStore[key] = String(value);
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('initialization', () => {
    it('returns initialValue when localStorage is empty for given key', () => {
      const { result } = renderHook(() =>
        useLocalStorage<string>('test-key', 'giá_trị_mặc_định'),
      );

      expect(result.current[0]).toBe('giá_trị_mặc_định');
      expect(window.localStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('returns stored value parsed from JSON when key exists in localStorage', () => {
      mockStore['user_profile'] = JSON.stringify({
        name: 'Nguyễn Văn A',
        role: 'admin',
      });

      const { result } = renderHook(() =>
        useLocalStorage('user_profile', { name: '', role: '' }),
      );

      expect(result.current[0]).toEqual({
        name: 'Nguyễn Văn A',
        role: 'admin',
      });
      expect(window.localStorage.getItem).toHaveBeenCalledWith('user_profile');
    });

    it('returns initialValue and logs error when window.localStorage.getItem throws an exception', () => {
      const storageError = new Error('SecurityError: localStorage is disabled');
      mockGetItem.mockImplementationOnce(() => {
        throw storageError;
      });

      const { result } = renderHook(() =>
        useLocalStorage<string>('forbidden-key', 'fallback_value'),
      );

      expect(result.current[0]).toBe('fallback_value');
      expect(console.error).toHaveBeenCalledWith(storageError);
    });

    it('returns initialValue and logs error when stored JSON string is invalid/malformed', () => {
      mockStore['corrupted-key'] = '{invalid_json: true';

      const { result } = renderHook(() =>
        useLocalStorage<string>('corrupted-key', 'fallback_on_corrupt'),
      );

      expect(result.current[0]).toBe('fallback_on_corrupt');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setValue', () => {
    it('updates state and persists directly passed value to localStorage', () => {
      const { result } = renderHook(() =>
        useLocalStorage<string>('theme', 'light'),
      );

      expect(result.current[0]).toBe('light');

      act(() => {
        result.current[1]('dark');
      });

      expect(result.current[0]).toBe('dark');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'theme',
        JSON.stringify('dark'),
      );
      expect(mockStore['theme']).toBe(JSON.stringify('dark'));
    });

    it('updates state and persists value using updater function', () => {
      const { result } = renderHook(() =>
        useLocalStorage<number>('counter', 10),
      );

      expect(result.current[0]).toBe(10);

      act(() => {
        result.current[1]((prev) => prev + 5);
      });

      expect(result.current[0]).toBe(15);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'counter',
        JSON.stringify(15),
      );
      expect(mockStore['counter']).toBe(JSON.stringify(15));
    });

    it('supports complex nested objects and arrays with updater function', () => {
      interface Settings {
        language: string;
        notifications: boolean;
        tags: string[];
      }

      const initialSettings: Settings = {
        language: 'vi',
        notifications: true,
        tags: ['sale', 'voucher'],
      };

      const { result } = renderHook(() =>
        useLocalStorage<Settings>('app-settings', initialSettings),
      );

      act(() => {
        result.current[1]((prev) => ({
          ...prev,
          language: 'en',
          tags: [...prev.tags, 'new'],
        }));
      });

      expect(result.current[0]).toEqual({
        language: 'en',
        notifications: true,
        tags: ['sale', 'voucher', 'new'],
      });
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'app-settings',
        JSON.stringify({
          language: 'en',
          notifications: true,
          tags: ['sale', 'voucher', 'new'],
        }),
      );
    });

    it('catches and logs error when window.localStorage.setItem throws (e.g. QuotaExceededError)', () => {
      const quotaError = new Error('QuotaExceededError');
      mockSetItem.mockImplementationOnce(() => {
        throw quotaError;
      });

      const { result } = renderHook(() =>
        useLocalStorage<string>('storage-quota-test', 'initial'),
      );

      act(() => {
        result.current[1]('overflow_value');
      });

      expect(result.current[0]).toBe('overflow_value');
      expect(console.error).toHaveBeenCalledWith(quotaError);
    });

    it('catches and logs error when updater function throws an error', () => {
      const functionError = new Error('Calculation error');

      const { result } = renderHook(() =>
        useLocalStorage<number>('calc-test', 100),
      );

      act(() => {
        result.current[1](() => {
          throw functionError;
        });
      });

      expect(result.current[0]).toBe(100);
      expect(console.error).toHaveBeenCalledWith(functionError);
    });
  });

  describe('component integration and user interactions', () => {
    function StorageConsumerComponent() {
      const [status, setStatus] = useLocalStorage<string>(
        'admin_status',
        'Đang hoạt động',
      );

      return React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          { 'data-testid': 'status-display' },
          status,
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setStatus('Tạm dừng'),
          },
          'Đổi sang tạm dừng',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setStatus((prev) => `${prev} - Đã xác nhận`),
          },
          'Nối chuỗi xác nhận',
        ),
      );
    }

    it('renders initial state and updates via user clicks', async () => {
      const user = userEvent.setup();
      render(React.createElement(StorageConsumerComponent));

      const display = screen.getByTestId('status-display');
      expect(display).toHaveTextContent('Đang hoạt động');

      const pauseButton = screen.getByRole('button', {
        name: 'Đổi sang tạm dừng',
      });
      await user.click(pauseButton);

      expect(display).toHaveTextContent('Tạm dừng');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'admin_status',
        JSON.stringify('Tạm dừng'),
      );

      const confirmButton = screen.getByRole('button', {
        name: 'Nối chuỗi xác nhận',
      });
      await user.click(confirmButton);

      expect(display).toHaveTextContent('Tạm dừng - Đã xác nhận');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'admin_status',
        JSON.stringify('Tạm dừng - Đã xác nhận'),
      );
    });
  });
});
