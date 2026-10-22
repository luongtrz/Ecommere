import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

type Listener = () => void;

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  onchange: null;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  change: (newMatches: boolean) => void;
}

const createMockMediaQueryList = (
  query: string,
  initialMatches: boolean = false,
): MockMediaQueryList => {
  const listeners = new Set<Listener>();

  const mediaList: MockMediaQueryList = {
    matches: initialMatches,
    media: query,
    onchange: null,
    addEventListener: vi.fn((event: string, callback: Listener) => {
      if (event === 'change') {
        listeners.add(callback);
      }
    }),
    removeEventListener: vi.fn((event: string, callback: Listener) => {
      if (event === 'change') {
        listeners.delete(callback);
      }
    }),
    dispatchEvent: vi.fn(),
    change: (newMatches: boolean) => {
      mediaList.matches = newMatches;
      const currentListeners = Array.from(listeners);
      currentListeners.forEach((listener) => listener());
    },
  };

  return mediaList;
};

describe('useMediaQuery', () => {
  let mediaMap: Map<string, MockMediaQueryList>;
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mediaMap = new Map();

    matchMediaMock = vi.fn().mockImplementation((query: string) => {
      if (!mediaMap.has(query)) {
        mediaMap.set(query, createMockMediaQueryList(query, false));
      }
      return mediaMap.get(query);
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when media query does not match initially', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    expect(result.current).toBe(false);

    const media = mediaMap.get('(min-width: 768px)')!;
    expect(media.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('returns true when media query matches initially', () => {
    mediaMap.set(
      '(min-width: 768px)',
      createMockMediaQueryList('(min-width: 768px)', true),
    );

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    expect(result.current).toBe(true);

    const media = mediaMap.get('(min-width: 768px)')!;
    expect(media.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('updates state to true when change event listener fires with matching media', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(result.current).toBe(false);

    const media = mediaMap.get('(min-width: 1024px)')!;

    act(() => {
      media.change(true);
    });

    expect(result.current).toBe(true);
  });

  it('updates state to false when change event listener fires with non-matching media', () => {
    mediaMap.set(
      '(min-width: 1024px)',
      createMockMediaQueryList('(min-width: 1024px)', true),
    );

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(result.current).toBe(true);

    const media = mediaMap.get('(min-width: 1024px)')!;

    act(() => {
      media.change(false);
    });

    expect(result.current).toBe(false);
  });

  it('unsubscribes and resubscribes when query argument changes', () => {
    const initialQuery = '(min-width: 640px)';
    const nextQuery = '(min-width: 1280px)';

    mediaMap.set(initialQuery, createMockMediaQueryList(initialQuery, false));
    mediaMap.set(nextQuery, createMockMediaQueryList(nextQuery, true));

    const { result, rerender } = renderHook(({ q }) => useMediaQuery(q), {
      initialProps: { q: initialQuery },
    });

    expect(result.current).toBe(false);
    const initialMedia = mediaMap.get(initialQuery)!;
    expect(initialMedia.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    rerender({ q: nextQuery });

    expect(initialMedia.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
    expect(window.matchMedia).toHaveBeenCalledWith(nextQuery);
    expect(result.current).toBe(true);

    const nextMedia = mediaMap.get(nextQuery)!;
    expect(nextMedia.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('cleans up event listener on unmount', () => {
    const query = '(prefers-color-scheme: dark)';
    const { unmount } = renderHook(() => useMediaQuery(query));

    const media = mediaMap.get(query)!;
    expect(media.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    unmount();

    expect(media.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('renders a responsive component and updates UI text on media change', () => {
    const desktopQuery = '(min-width: 1024px)';
    const media = createMockMediaQueryList(desktopQuery, false);
    mediaMap.set(desktopQuery, media);

    function ResponsiveNavbar() {
      const isDesktop = useMediaQuery(desktopQuery);

      return React.createElement(
        'nav',
        { 'data-testid': 'nav-container' },
        isDesktop
          ? React.createElement(
              'span',
              { 'data-testid': 'nav-mode' },
              'Giao diện máy tính',
            )
          : React.createElement(
              'span',
              { 'data-testid': 'nav-mode' },
              'Giao diện di động',
            ),
      );
    }

    const { unmount } = render(React.createElement(ResponsiveNavbar));

    const navMode = screen.getByTestId('nav-mode');
    expect(navMode).toHaveTextContent('Giao diện di động');

    act(() => {
      media.change(true);
    });

    expect(screen.getByTestId('nav-mode')).toHaveTextContent(
      'Giao diện máy tính',
    );

    act(() => {
      media.change(false);
    });

    expect(screen.getByTestId('nav-mode')).toHaveTextContent(
      'Giao diện di động',
    );

    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});
