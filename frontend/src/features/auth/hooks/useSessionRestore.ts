import { useEffect, useState } from 'react';
import apiClient, { authToken } from '@/lib/api';

/**
 * Hook to restore session on app initialization
 * Attempts to refresh access token from HTTP-only cookie
 */
export function useSessionRestore() {
  const [isRestoring, setIsRestoring] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      // Check if user was logged in before (from previous session)
      const userStr = localStorage.getItem('user');

      if (!userStr) {
        setIsRestoring(false);
        return;
      }

      try {
        // Try to refresh token (refreshToken cookie should still exist)
        const { data } = await apiClient.post('/auth/refresh');
        const actualData = data.data || data;

        // Store new access token in memory
        authToken.set(actualData.accessToken);
        
        setIsAuthenticated(true);
        console.log('✅ Session restored successfully');
      } catch (error) {
        // Refresh failed → session expired
        console.log('❌ Session expired, please login again');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, []);

  return { isRestoring, isAuthenticated };
}
