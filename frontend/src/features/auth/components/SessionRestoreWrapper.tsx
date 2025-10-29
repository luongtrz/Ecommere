import { ReactNode, useEffect, useState } from 'react';
import apiClient, { authToken } from '@/lib/api';

interface SessionRestoreWrapperProps {
  children: ReactNode;
}

let isRestoringSession = false;
let hasRestoredSession = false;

export function SessionRestoreWrapper({ children }: SessionRestoreWrapperProps) {
  const [isRestoring, setIsRestoring] = useState(!hasRestoredSession);

  useEffect(() => {
    if (hasRestoredSession || isRestoringSession) {
      setIsRestoring(false);
      return;
    }

    isRestoringSession = true;

    const restoreSession = async () => {
      const userStr = localStorage.getItem('user');

      if (!userStr) {
        setIsRestoring(false);
        hasRestoredSession = true;
        isRestoringSession = false;
        return;
      }

      try {
        const { data } = await apiClient.post('/auth/refresh');
        const actualData = data.data || data;

        authToken.set(actualData.accessToken);
        
        console.log('✅ Session restored successfully');
      } catch (error) {
        console.log('❌ Session expired, please login again');
        localStorage.removeItem('user');
      } finally {
        setIsRestoring(false);
        hasRestoredSession = true;
        isRestoringSession = false;
      }
    };

    restoreSession();
  }, []);

  if (isRestoring) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Đang khôi phục phiên làm việc...
      </div>
    );
  }

  return <>{children}</>;
}
