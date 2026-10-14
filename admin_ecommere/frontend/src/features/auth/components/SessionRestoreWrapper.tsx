import { ReactNode, useEffect } from 'react';
import { authToken, refreshAccessToken } from '@/lib/api';
import { useCartStore } from '@/features/cart/store/cartStore';

interface SessionRestoreWrapperProps {
  children: ReactNode;
}

let sessionRestorePromise: Promise<void> | null = null;

export function SessionRestoreWrapper({ children }: SessionRestoreWrapperProps) {
  useEffect(() => {
    // Chỉ restore token nếu có user trong localStorage
    const restoreSession = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      try {
        await refreshAccessToken();
      } catch (error) {
        console.log('Session expired');
        authToken.remove();
        useCartStore.getState().clearCart();
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    };

    if (!sessionRestorePromise) {
      sessionRestorePromise = restoreSession().finally(() => {
        sessionRestorePromise = null;
      });
    }

    void sessionRestorePromise;
  }, []);

  return <>{children}</>;
}
