'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { TOAST_COLORS, TOAST_STYLES, TOAST_POSITIONING, TOAST_CONFIG } from '@/lib/toast-constants';

/**
 * Toast Provider component that provides consistent toast notifications
 * with dark styling and smart positioning based on admin/regular pages
 */
export function ToastProvider() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin') && pathname !== '/admin/login';

  const baseStyle = {
    background: TOAST_COLORS.background,
    border: `1px solid ${TOAST_COLORS.border.default}`,
    color: TOAST_COLORS.text,
    ...TOAST_STYLES,
  };

  return (
    <Toaster
      position="top-right"
      containerStyle={{
        top: isAdminPage ? TOAST_POSITIONING.adminTop : TOAST_POSITIONING.defaultTop,
        right: TOAST_POSITIONING.right,
        zIndex: TOAST_POSITIONING.zIndex,
      }}
      toastOptions={{
        duration: TOAST_CONFIG.duration,
        style: baseStyle,
        success: {
          iconTheme: {
            primary: TOAST_COLORS.border.success,
            secondary: TOAST_COLORS.text,
          },
          style: {
            ...baseStyle,
            border: `1px solid ${TOAST_COLORS.border.success}`,
          },
        },
        error: {
          iconTheme: {
            primary: TOAST_COLORS.border.error,
            secondary: TOAST_COLORS.text,
          },
          style: {
            ...baseStyle,
            border: `1px solid ${TOAST_COLORS.border.error}`,
          },
        },
      }}
    />
  );
}