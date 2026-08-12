import { ReactNode, useEffect } from 'react';
import apiClient, { authToken } from '@/lib/api';
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
        const { data } = await apiClient.post('/auth/refresh');
        const actualData = data.data || data;
        authToken.set(actualData.accessToken);
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
