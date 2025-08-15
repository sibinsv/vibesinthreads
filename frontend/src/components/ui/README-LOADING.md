# Loading States Implementation

This document describes the loading states system implemented for the admin interface.

## Components

### LoadingSpinner
A reusable spinner component with customizable size and color.

```tsx
<LoadingSpinner size="sm" | "md" | "lg" color="primary" | "white" | "muted" />
```

### Enhanced Button Component
The Button component now supports loading states with the following props:

```tsx
<Button 
  isLoading={boolean}           // Shows spinner and disables button
  loadingText="Custom text..."  // Optional: custom loading text
  loadingText=""                // Empty string: icon-only loading (no text)
>
  Button Content
</Button>
```

## Usage Examples

### Form Save Button
```tsx
<Button 
  isLoading={isSaving}
  loadingText="Saving Product..."
>
  <Save className="h-4 w-4" />
  Save Product
</Button>
```

### Icon-Only Action Button
```tsx
<Button 
  variant="ghost"
  size="sm"
  isLoading={isDeleting}
  loadingText=""  // Empty string for icon-only loading
>
  <Trash2 className="h-4 w-4" />
</Button>
```

### Bulk Action Button
```tsx
<Button 
  variant="outline"
  isLoading={isDeleting}
  loadingText="Deleting..."
>
  <Trash2 className="h-4 w-4 mr-1" />
  Delete Selected
</Button>
```

## Implementation Details

- Buttons are automatically disabled when `isLoading` is true
- Spinner color automatically adjusts based on button variant
- For icon-only buttons, use `loadingText=""` to show only the spinner
- Individual item loading states are tracked using `Set<number>` for IDs
- Bulk actions use a separate loading state for the bulk action button

## Best Practices

1. Always provide meaningful loading text for form submissions
2. Use empty loadingText for icon-only buttons to maintain layout
3. Track individual item states for better UX in lists
4. Disable other actions when loading is in progress
5. Clear loading states in finally blocks to handle errors properly