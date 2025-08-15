/**
 * Toast System - Main exports
 * 
 * Centralized export file for the toast notification system.
 * Import everything you need from this file.
 */

// Main hook
export { useToast } from '@/hooks/useToast';

// Components
export { ToastProvider } from '@/components/ToastProvider';
export { ConfirmModal } from '@/components/ui/ConfirmModal';

// Types and constants
export { 
  TOAST_COLORS, 
  TOAST_STYLES, 
  TOAST_POSITIONING, 
  TOAST_CONFIG,
  type ToastOptions 
} from '@/lib/toast-constants';

// Usage example:
// import { useToast, ConfirmModal } from '@/lib/toast';