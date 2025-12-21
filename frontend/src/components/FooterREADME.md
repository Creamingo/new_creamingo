# Creamingo Footer Component

A responsive, elegant footer component for the Creamingo website with chocolaty gradient design, SEO optimization, and smooth animations.

## Features

🎨 **Design & Theme**
- Light-to-dark chocolaty gradient background (#4B2E16 → #2E1B0C)
- Cream beige text color (#FFF5E1) with hover effects (#F5D08A)
- Clean, elegant sans-serif typography
- Subtle shadows and 8px rounded corners
- Premium, compact design

🧱 **Layout Structure**
- 4 main columns: About, Quick Links, Support & Policies, Let's Connect
- Newsletter subscription section
- Bottom bar with copyright information
- Responsive design (desktop: 4 columns, tablet: 2x2 grid, mobile: stacked)

⚙️ **Technical Features**
- React + TypeScript + Tailwind CSS
- Framer Motion animations with staggered entrance effects
- Semantic HTML with proper accessibility (aria-labels)
- Schema.org JSON-LD markup for SEO
- Form handling for newsletter subscription

## Installation

1. **Install Framer Motion** (required for animations):
```bash
npm install framer-motion
```

2. **Import the component**:
```tsx
import Footer from './components/Footer';
```

## Usage

### Basic Usage
```tsx
import React from 'react';
import Footer from './components/Footer';

const App = () => {
  return (
    <div>
      {/* Your main content */}
      <main>
        {/* Page content goes here */}
      </main>
      
      {/* Footer at the bottom */}
      <Footer />
    </div>
  );
};

export default App;
```

### With Layout Example
```tsx
import React from 'react';
import Footer from './components/Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header>
        {/* Your header content */}
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};
```

## Customization

### Colors
The component uses CSS custom properties that can be overridden:

```css
:root {
  --footer-bg-start: #4B2E16;
  --footer-bg-end: #2E1B0C;
  --footer-text: #FFF5E1;
  --footer-hover: #F5D08A;
}
```

### Links
Update the links in the component to match your actual routes:

```tsx
// In the Footer component, update these href attributes:
<a href="/your-actual-route">Link Text</a>
```

### Contact Information
Update the contact details in the "Let's Connect" section:

```tsx
// Update these values in the Footer component:
- Address: "123 Baker Street, Mumbai, Maharashtra 400001"
- Phone: "+91-9876543210"
- Email: "info@creamingo.com"
```

### Social Media Links
Update the social media URLs in the SocialIcon components:

```tsx
<SocialIcon href="https://your-instagram-url" label="Follow us on Instagram">
```

## SEO Features

### Schema.org Markup
The component includes structured data for:
- Organization information
- Contact details
- Social media profiles
- Business address

### Semantic HTML
- Uses proper `<footer>`, `<nav>`, `<section>` tags
- Includes `aria-label` attributes for accessibility
- Proper heading hierarchy (h3, h4)

## Responsive Behavior

- **Desktop (lg+)**: 4 columns in a single row
- **Tablet (md)**: 2x2 grid layout
- **Mobile (sm)**: Single column, stacked vertically
- **Newsletter**: Responsive form layout with stacked inputs on mobile

## Animation Details

- **Entrance animations**: Staggered fade-in with upward motion
- **Hover effects**: Scale and color transitions
- **Newsletter**: Form validation with success feedback
- **Social icons**: Scale animations on hover/tap

## Browser Support

- Modern browsers with CSS Grid support
- ES6+ JavaScript features
- CSS custom properties

## Dependencies

- React 16.8+ (hooks support)
- Framer Motion 6+
- Tailwind CSS 3+

## File Structure

```
components/
├── Footer.tsx              # Main footer component
├── FooterExample.tsx       # Usage example
└── FooterREADME.md         # This documentation
```

## Performance Notes

- Uses `whileInView` for animations to prevent unnecessary renders
- Lazy loads animations only when footer comes into viewport
- Optimized SVG icons for better performance
- Minimal bundle impact with tree-shaking support

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast color ratios
- Focus indicators for interactive elements
