// Simple toast hook
// For production, consider using a library like sonner or react-hot-toast

type ToastType = 'success' | 'error' | 'warning' | 'info';

export function useToast() {
  const showToast = (type: ToastType, message: string) => {
    // For now, using console.log
    // In production, this would trigger a toast UI component
    const prefix = type.toUpperCase();
    console.log(`[${prefix}] ${message}`);
    
    // You can also use alert for critical errors
    if (type === 'error') {
      alert(message);
    }
  };

  return {
    toast: (message: string) => showToast('info', message),
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
    warning: (message: string) => showToast('warning', message),
    info: (message: string) => showToast('info', message),
  };
}
