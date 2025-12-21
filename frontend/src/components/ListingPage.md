# ListingPage Component

A dynamic, reusable listing page component for categories and subcategories in the Creamingo ecommerce website.

## Features

- **Dynamic Routing**: Supports both category and subcategory routes
- **SEO Optimized**: Dynamic meta tags and titles
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Product Grid**: Lazy loading images with wishlist functionality
- **Sorting & Filtering**: Multiple sort options and view modes
- **API Integration**: Real API calls with fallback to mock data
- **Consistent Styling**: Follows Creamingo design system

## Route Structure

```
/category/:categorySlug
/category/:categorySlug/:subCategorySlug
```

## Usage

The component is automatically used by the Next.js routing system:

1. **Category Page**: `/category/birthday-cakes`
2. **Subcategory Page**: `/category/birthday-cakes/kids-birthday`

## API Endpoints

The component expects these API endpoints:

### Categories
- `GET /api/categories/:slug` - Get category by slug
- `GET /api/categories/:categorySlug/:subCategorySlug` - Get subcategory

### Products
- `GET /api/products?category=:slug&subcategory=:subslug&sort=:sortBy` - Get products

## Component Props

The component automatically extracts route parameters from Next.js:

- `categorySlug` - From URL parameter
- `subCategorySlug` - From URL parameter (optional)

## Styling

The component follows Creamingo's design system:

- **Theme Colors**: Purple and pink gradients
- **Borders**: Thin light purple borders (`border-purple-200`, `border-purple-300`)
- **Consistent Padding**: Matches category grid boxes
- **Responsive**: Mobile-first with desktop enhancements

## Features

### Product Display
- Grid/List view toggle
- Lazy loading images
- Wishlist functionality
- Weight selector
- Price display with discounts
- Star ratings and reviews

### Sorting Options
- Popularity (default)
- Price: Low to High
- Price: High to Low
- Rating
- Newest

### SEO Features
- Dynamic page titles
- Meta descriptions
- Open Graph tags
- Twitter Card support

## Error Handling

- Graceful fallback to mock data if API fails
- Loading states with spinners
- Error messages for failed requests
- 404 handling for missing categories

## Performance

- Lazy loading for product images
- Optimized API calls
- Efficient state management
- Responsive image loading

## Customization

The component is designed to be easily customizable:

1. **Styling**: Modify TailwindCSS classes
2. **API Integration**: Update API service files
3. **Product Display**: Customize product card layout
4. **Sorting**: Add new sort options
5. **Filters**: Extend filtering capabilities

## Dependencies

- React 18+
- Next.js 13+
- TailwindCSS
- Lucide React (icons)
- Custom API services

## File Structure

```
src/
├── components/
│   └── ListingPage.jsx
├── app/
│   └── category/
│       ├── [categorySlug]/
│       │   └── page.js
│       └── [categorySlug]/
│           └── [subCategorySlug]/
│               └── page.js
└── api/
    ├── categoryApi.js
    └── productApi.js
```
