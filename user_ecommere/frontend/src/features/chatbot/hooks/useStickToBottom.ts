import { useRef, useState, useEffect, useCallback, type RefObject } from 'react';

const BOTTOM_THRESHOLD_PX = 80;

/**
 * Hook to manage pinned-to-bottom scrolling behavior in chat containers.
 *
 * Tracks if the user is at the bottom (within ~80px).
 * When `deps` update, re-scrolls instantly ('auto') only if pinned.
 * If the user has scrolled up, it preserves their scroll position.
 */
export function useStickToBottom<T extends HTMLElement = HTMLDivElement>(
  deps: ReadonlyArray<unknown>
): {
  scrollRef: RefObject<T>;
  isAtBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
} {
  const scrollRef = useRef<T>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const isAtBottomRef = useRef<boolean>(true);
  const activeElementRef = useRef<T | null>(null);
  const listenerRef = useRef<(() => void) | null>(null);

  // Detach listener on unmount with a separate effect that has an empty dependency array
  useEffect(() => {
    return () => {
      if (activeElementRef.current && listenerRef.current) {
        activeElementRef.current.removeEventListener('scroll', listenerRef.current);
        listenerRef.current = null;
        activeElementRef.current = null;
      }
    };
  }, []);

  // Detect when the container element changes (e.g. mounts or unmounts later).
  // Runs after each render but attaches/detaches ONLY when the container element actually changes.
  // Never recompute isAtBottom here unless a brand new element was attached.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const element = scrollRef.current;
    if (element === activeElementRef.current) return;

    // Detach listener from previously attached element if any
    if (activeElementRef.current && listenerRef.current) {
      activeElementRef.current.removeEventListener('scroll', listenerRef.current);
      listenerRef.current = null;
    }

    activeElementRef.current = element;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD_PX;
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
    };

    listenerRef.current = handleScroll;
    element.addEventListener('scroll', handleScroll, { passive: true });

    // A freshly attached container starts pinned to the latest message (chat convention).
    // Computing it from the DOM here would report "not at bottom" for a long conversation
    // because a new container always starts at scrollTop 0.
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    element.scrollTo({ top: element.scrollHeight, behavior: 'auto' });
  });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (typeof window === 'undefined') return;
    const element = scrollRef.current;
    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior,
    });
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  }, []);

  // When deps change: re-scroll with behavior 'auto' ONLY if the user was at the bottom
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const element = scrollRef.current;
    if (!element) return;

    if (isAtBottomRef.current) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'auto',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
  };
}

export default useStickToBottom;
