/**
 * Shared constants for toast styling and configuration
 * Used by ToastProvider and useToast hook to maintain consistency
 */

export const TOAST_COLORS = {
  background: 'hsl(0 0% 15%)',     // Dark background for visibility
  text: 'hsl(0 0% 95%)',           // Light text for contrast
  border: {
    default: 'hsl(0 0% 25%)',      // Default gray border
    success: 'hsl(142 76% 36%)',   // Green for success
    error: 'hsl(0 84% 60%)',       // Red for errors
    warning: 'hsl(45 93% 47%)',    // Orange for warnings
    info: 'hsl(217 91% 60%)',      // Blue for info
  },
} as const;

export const TOAST_STYLES = {
  borderRadius: '0.5rem',          // Rounded corners
  padding: '16px',                 // Internal padding
  fontWeight: '500',               // Medium font weight
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)', // Enhanced shadow
  maxWidth: '400px',               // Max width for readability
  wordBreak: 'break-word' as const, // Text wrapping
} as const;

export const TOAST_POSITIONING = {
  adminTop: '88px',                // Position below admin header
  defaultTop: '20px',              // Standard positioning
  right: '16px',                   // Right margin
  zIndex: 9999,                    // High z-index for visibility
} as const;

export const TOAST_CONFIG = {
  duration: 4000,                  // Default duration (4 seconds)
  errorDuration: 5000,             // Error duration (5 seconds)
  position: 'top-right' as const,  // Default position
} as const;

/**
 * Toast options interface for consistent configuration
 */
export interface ToastOptions {
  duration?: number;
  position?: 'top-center' | 'top-left' | 'top-right' | 'bottom-center' | 'bottom-left' | 'bottom-right';
}