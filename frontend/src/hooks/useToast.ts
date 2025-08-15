import toast from 'react-hot-toast';
import { TOAST_COLORS, TOAST_STYLES, TOAST_CONFIG, type ToastOptions } from '@/lib/toast-constants';

/**
 * Custom toast hook providing a consistent API for all toast notifications
 * Includes success, error, warning, info, loading, promise, and custom toasts
 */
export const useToast = () => {
  const showToast = {
    /**
     * Display a success toast notification
     */
    success: (message: string, options?: ToastOptions) => {
      toast.success(message, {
        duration: options?.duration || TOAST_CONFIG.duration,
        position: options?.position || TOAST_CONFIG.position,
      });
    },

    /**
     * Display an error toast notification with longer duration
     */
    error: (message: string, options?: ToastOptions) => {
      toast.error(message, {
        duration: options?.duration || TOAST_CONFIG.errorDuration,
        position: options?.position || TOAST_CONFIG.position,
      });
    },

    /**
     * Display a warning toast notification with custom styling
     */
    warning: (message: string, options?: ToastOptions) => {
      toast(message, {
        duration: options?.duration || TOAST_CONFIG.duration,
        position: options?.position || TOAST_CONFIG.position,
        icon: '⚠️',
        style: {
          background: TOAST_COLORS.background,
          border: `1px solid ${TOAST_COLORS.border.warning}`,
          color: TOAST_COLORS.text,
          borderRadius: TOAST_STYLES.borderRadius,
          boxShadow: TOAST_STYLES.boxShadow,
        },
      });
    },

    /**
     * Display an info toast notification with custom styling
     */
    info: (message: string, options?: ToastOptions) => {
      toast(message, {
        duration: options?.duration || TOAST_CONFIG.duration,
        position: options?.position || TOAST_CONFIG.position,
        icon: 'ℹ️',
        style: {
          background: TOAST_COLORS.background,
          border: `1px solid ${TOAST_COLORS.border.info}`,
          color: TOAST_COLORS.text,
          borderRadius: TOAST_STYLES.borderRadius,
          boxShadow: TOAST_STYLES.boxShadow,
        },
      });
    },

    /**
     * Display a loading toast notification that can be updated
     * Returns toast ID for later updates
     */
    loading: (message: string, options?: ToastOptions) => {
      return toast.loading(message, {
        position: options?.position || TOAST_CONFIG.position,
      });
    },

    /**
     * Display promise-based toast with loading, success, and error states
     * Automatically handles state transitions based on promise resolution
     */
    promise: <T>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      },
      options?: ToastOptions
    ) => {
      return toast.promise(promise, messages, {
        position: options?.position || TOAST_CONFIG.position,
      });
    },

    /**
     * Dismiss all active toasts
     */
    dismiss: () => {
      toast.dismiss();
    },

    /**
     * Display a custom toast with full control over styling
     */
    custom: (message: string, options?: ToastOptions & { 
      icon?: string; 
      className?: string;
      style?: React.CSSProperties;
    }) => {
      toast(message, {
        duration: options?.duration || TOAST_CONFIG.duration,
        position: options?.position || TOAST_CONFIG.position,
        icon: options?.icon,
        className: options?.className,
        style: options?.style,
      });
    },
  };

  return showToast;
};