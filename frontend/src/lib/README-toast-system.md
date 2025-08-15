# Toast Notification System

A comprehensive toast notification system built with `react-hot-toast` for the Vibes in Threads admin interface.

## Overview

This toast system replaces all browser `alert()` and `window.confirm()` calls with modern, non-blocking toast notifications and elegant confirmation modals. The system provides consistent styling, smart positioning, and a clean API.

## Features

- ✅ **Dark theme styling** with high contrast for visibility
- ✅ **Smart positioning** - automatically adjusts for admin header
- ✅ **Variant support** - success, error, warning, info, loading, and promise toasts  
- ✅ **Confirmation modals** - elegant replacements for `window.confirm()`
- ✅ **TypeScript support** - fully typed APIs
- ✅ **Consistent styling** - shared constants for maintainability
- ✅ **Accessibility** - ARIA compliant notifications

## Components

### 1. ToastProvider (`src/components/ToastProvider.tsx`)
The main provider component that configures the global toast settings.

```tsx
// Automatically included in root layout
<ToastProvider />
```

### 2. useToast Hook (`src/hooks/useToast.ts`)
Custom hook providing a consistent API for all toast types.

```tsx
import { useToast } from '@/hooks/useToast';

const toast = useToast();

// Basic usage
toast.success('Operation completed successfully!');
toast.error('Something went wrong');
toast.warning('Please review your changes');
toast.info('New feature available');

// Loading toast
const loadingToast = toast.loading('Saving...');
// Later: toast.dismiss(loadingToast);

// Promise-based toast
toast.promise(
  apiCall(),
  {
    loading: 'Saving product...',
    success: 'Product saved successfully!',
    error: 'Failed to save product',
  }
);
```

### 3. ConfirmModal (`src/components/ui/ConfirmModal.tsx`)
Elegant confirmation dialog component.

```tsx
import { ConfirmModal } from '@/components/ui/ConfirmModal';

<ConfirmModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirm}
  title="Delete Product"
  message="Are you sure you want to delete this product? This action cannot be undone."
  variant="danger"
  confirmText="Delete"
  cancelText="Cancel"
/>
```

### 4. Toast Constants (`src/lib/toast-constants.ts`)
Shared styling and configuration constants.

## API Reference

### useToast Methods

| Method | Description | Duration | Example |
|--------|-------------|----------|---------|
| `success(message, options?)` | Success notification | 4s | `toast.success('Saved!')` |
| `error(message, options?)` | Error notification | 5s | `toast.error('Failed to save')` |
| `warning(message, options?)` | Warning notification | 4s | `toast.warning('Review changes')` |
| `info(message, options?)` | Info notification | 4s | `toast.info('New feature')` |
| `loading(message, options?)` | Loading notification | ∞ | `toast.loading('Processing...')` |
| `promise(promise, messages, options?)` | Promise-based toast | Auto | See example above |
| `dismiss()` | Dismiss all toasts | - | `toast.dismiss()` |
| `custom(message, options)` | Custom styled toast | 4s | Custom implementation |

### Toast Options

```tsx
interface ToastOptions {
  duration?: number;  // Override default duration
  position?: 'top-center' | 'top-left' | 'top-right' | 'bottom-center' | 'bottom-left' | 'bottom-right';
}
```

### ConfirmModal Props

```tsx
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;    // Default: "Confirm"
  cancelText?: string;     // Default: "Cancel" 
  variant?: 'danger' | 'warning' | 'info';  // Default: "danger"
  isLoading?: boolean;     // Default: false
}
```

## Styling

### Dark Theme
- **Background**: `hsl(0 0% 15%)` - Dark charcoal for visibility
- **Text**: `hsl(0 0% 95%)` - Light text for contrast
- **Borders**: Variant-specific colors (green, red, orange, blue)

### Colors
- **Success**: `hsl(142 76% 36%)` - Green
- **Error**: `hsl(0 84% 60%)` - Red
- **Warning**: `hsl(45 93% 47%)` - Orange
- **Info**: `hsl(217 91% 60%)` - Blue

### Positioning
- **Admin pages**: 88px from top (below header)
- **Regular pages**: 20px from top
- **All pages**: 16px from right, z-index 9999

## Migration from alert/confirm

### Before (Browser Alerts)
```tsx
// ❌ Old approach
alert('Product saved successfully!');
if (window.confirm('Delete this product?')) {
  deleteProduct();
}
```

### After (Toast System)
```tsx
// ✅ New approach
const toast = useToast();

toast.success('Product saved successfully!');

// With confirmation modal
const [showModal, setShowModal] = useState(false);

<ConfirmModal
  isOpen={showModal}
  onConfirm={() => {
    deleteProduct();
    setShowModal(false);
  }}
  onClose={() => setShowModal(false)}
  title="Delete Product"
  message="Are you sure you want to delete this product?"
/>
```

## Implementation Status

All admin pages have been updated to use the new toast system:

- ✅ Categories management (11 admin pages updated)
- ✅ Products management  
- ✅ Users management
- ✅ Settings management
- ✅ All form validations and API responses

## Dependencies

- `react-hot-toast` ^2.5.2 - Core toast functionality
- `@headlessui/react` ^2.2.7 - Accessibility features for modals
- `lucide-react` ^0.539.0 - Icons for UI components

## Maintenance

To modify toast styling:
1. Update constants in `src/lib/toast-constants.ts`
2. Changes automatically apply to all toast instances
3. Test with the admin interface

To add new toast variants:
1. Add color to `TOAST_COLORS.border`
2. Create method in `useToast` hook
3. Update TypeScript interfaces if needed