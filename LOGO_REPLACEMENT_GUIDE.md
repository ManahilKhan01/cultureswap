# Logo Replacement Guide

## Overview
This guide outlines how to replace the current logo (gradient "C" icon) with the new Logo_1_svg image throughout the application.

## Current Logo Implementation
The current logo is implemented as a gradient CSS element in multiple locations:

```tsx
<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-terracotta to-teal">
  <span className="text-lg font-bold text-white">C</span>
</div>
```

## Files Requiring Logo Updates

### 1. **Navbar Component** - `src/components/layout/Navbar.tsx`
   - **Line ~205**: Main navigation logo
   - **Current Implementation**: Gradient div with "C" text
   - **New Implementation**: Replace with `<img src="/Logo_1_svg.svg" alt="CultureSwap" className="h-9 w-9" />`

### 2. **Login Page** - `src/pages/Login.tsx`
   - **Check**: If logo is present in the header
   - **Location**: Header/top of login card

### 3. **Signup Page** - `src/pages/Signup.tsx`
   - **Check**: If logo is present in the header
   - **Location**: Header/top of signup card

### 4. **Forgot Password Page** - `src/pages/ForgotPassword.tsx`
   - **Line ~49**: Logo in card header
   - **Current**: `<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-terracotta to-teal">`
   - **New**: Replace with image import

### 5. **Reset Password Page** - `src/pages/ResetPassword.tsx`
   - **Line ~114**: Logo in card header
   - **Current**: Gradient div
   - **New**: Image replacement

### 6. **Footer Component** - `src/components/layout/Footer.tsx`
   - **Check**: For any logo references in footer
   - **Location**: Copyright/brand section

### 7. **Index/Landing Page** - `src/pages/Index.tsx`
   - **Check**: For any logo references
   - **Location**: Header/Navbar area

## Implementation Steps

### Step 1: Add Logo to Public Folder
Place the `Logo_1_svg.svg` file in the public folder:
```
public/Logo_1_svg.svg
```

### Step 2: Update Each Component

#### For Navbar (src/components/layout/Navbar.tsx)
Replace:
```tsx
<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-terracotta to-teal">
  <span className="text-lg font-bold text-white">C</span>
</div>
```

With:
```tsx
<img 
  src="/Logo_1_svg.svg" 
  alt="CultureSwap Logo" 
  className="h-9 w-9 object-contain"
/>
```

#### For Password Pages (ForgotPassword.tsx, ResetPassword.tsx)
Replace:
```tsx
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-terracotta to-teal">
  <span className="text-lg font-bold text-white">C</span>
</div>
```

With:
```tsx
<img 
  src="/Logo_1_svg.svg" 
  alt="CultureSwap Logo" 
  className="h-10 w-10 object-contain"
/>
```

### Step 3: Test All Screens
After implementation, verify:
- ✅ Header/Navbar displays new logo correctly
- ✅ Login page shows new logo
- ✅ Signup page shows new logo
- ✅ Forgot password page shows new logo
- ✅ Reset password page shows new logo
- ✅ All dashboards and pages display correctly
- ✅ Logo appears correctly on mobile/tablet sizes
- ✅ Logo has proper spacing and alignment

## CSS Adjustments (if needed)
If the new logo requires different sizing or styling, adjust the className:

```tsx
className="h-9 w-9 object-contain" // For navbar
className="h-10 w-10 object-contain" // For form headers
```

Use `object-contain` to maintain aspect ratio.

## Notes
- The new logo file should be an SVG or high-quality image
- Ensure the logo scales well at different sizes
- Test in both light and dark themes if applicable
- Maintain consistent sizing across all pages (9x9 for navbar, 10x10 for forms)
