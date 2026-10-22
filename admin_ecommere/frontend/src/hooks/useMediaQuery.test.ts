import { describe, expect, it, vi, beforeEach } from 'vitest';
import React, { useState } from 'react';
import { renderHook, act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMediaQuery } from './useMediaQuery';

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  _listeners: Set<() => void>;
  _triggerChange: (matches?: boolean) => void;
}

describe('useMediaQuery', () => {
  let mqlStore: Map<string, MockMediaQueryList>;

  function getOrCreateMql(
    query: string,
    initialMatches = false,
  ): MockMediaQueryList {
    const existing = mqlStore.get(query);
    if (existing) {
      return existing;
    }

    const listeners = new Set<() => void>();
    const mql: MockMediaQueryList = {
      matches: initialMatches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'change') {
          listeners.add(cb);
        }
      }),
      removeEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'change') {
          listeners.delete(cb);
        }
      }),
      dispatchEvent: vi.fn(),
      _listeners: listeners,
      _triggerChange(matches?: boolean) {
        if (matches !== undefined) {
          mql.matches = matches;
        }
        listeners.forEach((cb) => cb());
      },
    };

    mqlStore.set(query, mql);
    return mql;
  }

  beforeEach(() => {
    mqlStore = new Map();
    vi.restoreAllMocks();

    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      return getOrCreateMql(query, false);
    });
  });

  describe('initial match behavior', () => {
    it('returns false when media query does not match initially', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

      expect(result.current).toBe(false);
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');

      const mql = getOrCreateMql('(min-width: 1024px)');
      expect(mql.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });

    it('returns true when media query matches initially and synchronizes state', () => {
      getOrCreateMql('(min-width: 768px)', true);

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(true);
      const mql = getOrCreateMql('(min-width: 768px)');
      expect(mql.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });
  });

  describe('event listener updates and cleanup', () => {
    it('updates matches to true when listener is called via change event', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));

      expect(result.current).toBe(false);
      const mql = getOrCreateMql('(min-width: 600px)');

      act(() => {
        mql._triggerChange(true);
      });

      expect(result.current).toBe(true);
    });

    it('updates matches to false when media becomes non-matching', () => {
      getOrCreateMql('(max-width: 480px)', true);

      const { result } = renderHook(() => useMediaQuery('(max-width: 480px)'));

      expect(result.current).toBe(true);
      const mql = getOrCreateMql('(max-width: 480px)');

      act(() => {
        mql._triggerChange(false);
      });

      expect(result.current).toBe(false);
    });

    it('removes change event listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useMediaQuery('(orientation: portrait)'),
      );

      const mql = getOrCreateMql('(orientation: portrait)');
      expect(mql.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );

      unmount();

      expect(mql.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
      expect(mql._listeners.size).toBe(0);
    });

    it('handles query prop changes by cleaning up old listener and attaching new one', () => {
      const { result, rerender } = renderHook(
        ({ query }: { query: string }) => useMediaQuery(query),
        {
          initialProps: { query: '(min-width: 768px)' },
        },
      );

      const firstMql = getOrCreateMql('(min-width: 768px)');
      expect(result.current).toBe(false);
      expect(firstMql.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );

      rerender({ query: '(min-width: 1280px)' });

      expect(firstMql.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );

      const secondMql = getOrCreateMql('(min-width: 1280px)');
      expect(secondMql.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });
  });

  describe('component integration and user interactions', () => {
    function ResponsiveLayoutComponent({ query }: { query: string }) {
      const isMatched = useMediaQuery(query);

      return React.createElement(
        'div',
        null,
        React.createElement(
          'h1',
          { 'data-testid': 'layout-title' },
          isMatched ? 'Giao diện máy tính' : 'Giao diện di động',
        ),
        React.createElement(
          'p',
          { 'data-testid': 'layout-desc' },
          isMatched
            ? 'Hiển thị đầy đủ menu và bảng điều khiển'
            : 'Hiển thị menu rút gọn cho màn hình nhỏ',
        ),
      );
    }

    it('renders correct Vietnamese UI and updates when media query matches change', () => {
      const query = '(min-width: 900px)';
      render(React.createElement(ResponsiveLayoutComponent, { query }));

      expect(screen.getByTestId('layout-title')).toHaveTextContent(
        'Giao diện di động',
      );
      expect(screen.getByTestId('layout-desc')).toHaveTextContent(
        'Hiển thị menu rút gọn cho màn hình nhỏ',
      );

      const mql = getOrCreateMql(query);
      act(() => {
        mql._triggerChange(true);
      });

      expect(screen.getByTestId('layout-title')).toHaveTextContent(
        'Giao diện máy tính',
      );
      expect(screen.getByTestId('layout-desc')).toHaveTextContent(
        'Hiển thị đầy đủ menu và bảng điều khiển',
      );
    });

    it('handles query switching dynamically in rendered component with user interaction', async () => {
      const user = userEvent.setup();

      function QuerySwitcherContainer() {
        const [activeQuery, setActiveQuery] = useState('(min-width: 768px)');
        const matches = useMediaQuery(activeQuery);

        return React.createElement(
          'div',
          null,
          React.createElement(
            'div',
            { 'data-testid': 'match-indicator' },
            matches
              ? 'Khớp điều kiện màn hình'
              : 'Không khớp điều kiện màn hình',
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => setActiveQuery('(max-width: 500px)'),
            },
            'Chuyển sang màn hình nhỏ',
          ),
        );
      }

      getOrCreateMql('(min-width: 768px)', false);
      getOrCreateMql('(max-width: 500px)', true);

      render(React.createElement(QuerySwitcherContainer));

      expect(screen.getByTestId('match-indicator')).toHaveTextContent(
        'Không khớp điều kiện màn hình',
      );

      const switchBtn = screen.getByRole('button', {
        name: 'Chuyển sang màn hình nhỏ',
      });
      await user.click(switchBtn);

      expect(screen.getByTestId('match-indicator')).toHaveTextContent(
        'Khớp điều kiện màn hình',
      );
    });
  });
});
