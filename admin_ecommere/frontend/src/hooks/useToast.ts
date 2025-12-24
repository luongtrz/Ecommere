/**
 * Toast notification hook using Sonner library
 * Provides a clean API for showing toast notifications throughout the app
 */

import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    // Basic toast methods - backward compatible
    toast: (message: string) => sonnerToast(message),
    success: (message: string) => sonnerToast.success(message),
    error: (message: string) => sonnerToast.error(message),
    warning: (message: string) => sonnerToast.warning(message),
    info: (message: string) => sonnerToast.info(message),

    // Advanced features from Sonner
    promise: sonnerToast.promise,
    loading: sonnerToast.loading,
    dismiss: sonnerToast.dismiss,
  };
}
