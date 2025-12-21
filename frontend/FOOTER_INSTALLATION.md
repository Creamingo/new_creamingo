# Creamingo Footer Component - Installation Guide

## Quick Start (Recommended)

The easiest way to get started is to use the **FooterNoMotion.tsx** component which doesn't require any additional dependencies.

### 1. Copy the Component Files

Copy these files to your project:
- `src/components/FooterNoMotion.tsx` → `src/components/Footer.tsx`
- `src/styles/footer-animations.css` → `src/styles/footer-animations.css`

### 2. Import CSS Animations

Add the CSS animations to your main CSS file or import it in your component:

**Option A: Import in your main CSS file**
```css
/* In your main CSS file (e.g., globals.css, index.css) */
@import './styles/footer-animations.css';
```

**Option B: Import in your layout component**
```tsx
// In your layout or _app.tsx file
import '../styles/footer-animations.css';
```

### 3. Use the Component

```tsx
import React from 'react';
import Footer from './components/Footer';

const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Your main content */}
      </main>
      <Footer />
    </div>
  );
};

export default App;
```

## Advanced Setup (With Framer Motion)

If you want the enhanced animations with Framer Motion:

### 1. Install Framer Motion

```bash
npm install framer-motion
# or
yarn add framer-motion
```

### 2. Use the Enhanced Component

```tsx
import React from 'react';
import Footer from './components/Footer'; // Use the original Footer.tsx with Framer Motion

const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Your main content */}
      </main>
      <Footer />
    </div>
  );
};

export default App;
```

## Customization

### Update Contact Information

Edit the contact details in the Footer component:

```tsx
// Update these values in the Footer component:
- Address: "Your actual address"
- Phone: "Your phone number"
- Email: "your-email@domain.com"
```

### Update Social Media Links

```tsx
// Update the social media URLs:
<SocialIcon href="https://your-instagram-url" label="Follow us on Instagram">
<SocialIcon href="https://your-facebook-url" label="Follow us on Facebook">
<SocialIcon href="https://your-youtube-url" label="Subscribe to our YouTube channel">
<SocialIcon href="https://your-pinterest-url" label="Follow us on Pinterest">
```

### Update Navigation Links

Update the href attributes to match your actual routes:

```tsx
// Example updates:
<a href="/your-actual-route">Link Text</a>
```

### Customize Colors

The component uses Tailwind CSS classes. You can customize colors by:

1. **Using CSS custom properties** (recommended):
```css
:root {
  --footer-bg-start: #4B2E16;
  --footer-bg-end: #2E1B0C;
  --footer-text: #FFF5E1;
  --footer-hover: #F5D08A;
}
```

2. **Modifying Tailwind classes** directly in the component

## File Structure

After installation, your project should have:

```
src/
├── components/
│   ├── Footer.tsx              # Main footer component
│   ├── FooterExample.tsx       # Usage example (optional)
│   └── FooterREADME.md         # Documentation (optional)
├── styles/
│   └── footer-animations.css   # CSS animations (if using FooterNoMotion)
└── FOOTER_INSTALLATION.md      # This file
```

## Features Included

✅ **Design & Theme**
- Chocolaty gradient background (#4B2E16 → #2E1B0C)
- Cream beige text (#FFF5E1) with hover effects (#F5D08A)
- Clean, elegant typography
- Subtle shadows and rounded corners

✅ **Layout Structure**
- 4 responsive columns
- Newsletter subscription
- Bottom copyright bar
- Mobile-first responsive design

✅ **Technical Features**
- TypeScript support
- SEO-optimized with Schema.org markup
- Accessibility features (aria-labels, semantic HTML)
- Form handling for newsletter
- Smooth animations (CSS or Framer Motion)

✅ **Responsive Behavior**
- Desktop: 4 columns
- Tablet: 2x2 grid
- Mobile: Stacked vertically

## Browser Support

- Modern browsers with CSS Grid support
- ES6+ JavaScript features
- CSS custom properties

## Performance Notes

- Optimized SVG icons
- Minimal bundle impact
- Lazy-loaded animations
- Tree-shaking support

## Troubleshooting

### Common Issues

1. **Animations not working**
   - Make sure you've imported the CSS animations file
   - Check if you're using the correct component (FooterNoMotion vs Footer)

2. **Styling issues**
   - Ensure Tailwind CSS is properly configured
   - Check if all required Tailwind classes are available

3. **TypeScript errors**
   - Make sure you have React types installed: `npm install @types/react @types/react-dom`

4. **Framer Motion errors**
   - Install Framer Motion: `npm install framer-motion`
   - Use the correct component version

### Getting Help

If you encounter any issues:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure file paths are correct
4. Check Tailwind CSS configuration

## Next Steps

After installation:
1. Customize the content to match your brand
2. Update the contact information
3. Add your actual social media links
4. Test on different devices and browsers
5. Consider adding analytics tracking to links

## License

This component is created for the Creamingo project. Feel free to modify and use according to your project needs.
