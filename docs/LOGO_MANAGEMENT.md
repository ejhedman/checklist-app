# Logo Management Guide

## Overview

This guide explains how to manage the Releassimo logo to ensure it always renders crisply across all devices and screen densities.

## Current Implementation

### Logo Component
The `Logo` component (`src/components/ui/logo.tsx`) provides a standardized way to display the logo with:

- **Proper sizing**: Uses actual image dimensions (1024x334) for optimal scaling
- **Crisp rendering**: Applies `imageRendering: 'crisp-edges'` CSS property
- **High quality**: Uses `quality={100}` for maximum clarity
- **Responsive design**: Optional responsive sizing for different screen sizes
- **Priority loading**: Optional priority loading for above-the-fold logos

### Usage Examples

```tsx
// Basic usage
<Logo />

// With specific size
<Logo size="lg" />

// With responsive sizing
<Logo size="md" responsive />

// With priority loading (for header)
<Logo size="md" priority responsive />
```

### Available Sizes

- `sm`: 24px height (h-6)
- `md`: 32px height (h-8) - **default**
- `lg`: 48px height (h-12)
- `xl`: 64px height (h-16)

### Responsive Sizing

When `responsive={true}`, the logo uses different sizes on mobile vs desktop:

- `sm`: 16px mobile, 24px desktop
- `md`: 24px mobile, 32px desktop
- `lg`: 32px mobile, 48px desktop
- `xl`: 48px mobile, 64px desktop

## Logo File Specifications

### Current Logo
- **File**: `public/logo.png`
- **Dimensions**: 1024x334 pixels
- **Format**: PNG with transparency
- **File size**: ~149KB

### Optimization Strategy

For optimal performance and crisp rendering:

1. **Use the Logo component** instead of direct `<img>` or `<Image>` tags
2. **Preserve aspect ratio** - the component handles this automatically
3. **Use appropriate sizes** - don't scale down unnecessarily
4. **Enable responsive sizing** for mobile-friendly displays

## Best Practices

### ✅ Do's

- Use the `Logo` component for all logo displays
- Set `priority={true}` for above-the-fold logos (header, hero sections)
- Use `responsive={true}` for logos that appear on mobile devices
- Choose appropriate sizes based on context:
  - `sm`: Small contexts (toolbars, footers)
  - `md`: Standard contexts (headers, navigation)
  - `lg`: Large contexts (hero sections, landing pages)
  - `xl`: Extra large contexts (splash screens, presentations)

### ❌ Don'ts

- Don't use direct `<img>` tags for the logo
- Don't manually scale the logo with CSS
- Don't use the logo at sizes larger than intended
- Don't override the component's styling unless necessary

## Advanced Optimization (Optional)

For even better performance, you can generate optimized logo variants:

1. **Install sharp**: `npm install sharp`
2. **Run optimization script**: `node scripts/optimize-logo.js`
3. **Use optimized variants** in the Logo component

The script generates:
- `logo-sm.png` (200x65) - for small contexts
- `logo-md.png` (400x130) - for medium contexts  
- `logo-lg.png` (800x260) - for large contexts
- `logo-xl.png` (1024x334) - for extra large contexts
- `logo-2x.png` (2048x668) - for high-DPI displays

## Troubleshooting

### Blurry Logo
If the logo appears blurry:

1. **Check size usage**: Ensure you're using an appropriate size
2. **Verify responsive**: Enable responsive sizing for mobile
3. **Check browser**: Some browsers may not support `crisp-edges`
4. **Verify image quality**: Ensure the source PNG is high quality

### Performance Issues
If logo loading affects performance:

1. **Use priority loading**: Set `priority={true}` for important logos
2. **Optimize image**: Run the optimization script
3. **Consider lazy loading**: For below-the-fold logos

### Responsive Issues
If logo doesn't look good on mobile:

1. **Enable responsive**: Set `responsive={true}`
2. **Test different sizes**: Try smaller sizes for mobile
3. **Check container**: Ensure the container allows proper scaling

## Future Improvements

- [ ] Add WebP format support for better compression
- [ ] Implement automatic size detection based on container
- [ ] Add dark mode logo variants
- [ ] Create animated logo component for loading states 