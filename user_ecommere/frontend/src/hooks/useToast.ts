import { toast as sonner } from 'sonner';

export interface ToastActions {
  toast: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const toastActions: ToastActions = {
  toast: (message: string) => {
    sonner.info(message);
  },
  success: (message: string) => {
    sonner.success(message);
  },
  error: (message: string) => {
    sonner.error(message);
  },
  warning: (message: string) => {
    sonner.warning(message);
  },
  info: (message: string) => {
    sonner.info(message);
  },
};

export function useToast(): ToastActions {
  return toastActions;
}
