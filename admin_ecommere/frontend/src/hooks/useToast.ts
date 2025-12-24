/**
 * Toast notification hook using Sonner library
 * Provides a clean API for showing toast notifications throughout the app
 */

import { toast as sonnerToast } from 'sonner';
import { ReactNode } from 'react';

export function useToast() {
  return {
    // Basic toast methods - backward compatible
    toast: (message: string | ReactNode) => sonnerToast(message),
    success: (message: string | ReactNode) => sonnerToast.success(message),
    error: (message: string | ReactNode) => sonnerToast.error(message),
    warning: (message: string | ReactNode) => sonnerToast.warning(message),
    info: (message: string | ReactNode) => sonnerToast.info(message),

    // Advanced features from Sonner
    promise: sonnerToast.promise,
    loading: sonnerToast.loading,
    dismiss: sonnerToast.dismiss,
  };
}
