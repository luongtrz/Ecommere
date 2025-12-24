import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from 'sonner';
import { SessionRestoreWrapper } from '@/features/auth/components/SessionRestoreWrapper';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <SessionRestoreWrapper>
          {children}
        </SessionRestoreWrapper>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </HelmetProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
