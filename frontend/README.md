# Creamingo - Cake & Gift E-commerce Platform

A modern, responsive e-commerce platform for cakes, pastries, and gifts built with Next.js and Tailwind CSS.

## Features

### Search Functionality
- **Mobile Search**: Full-screen search overlay with trending searches
- **Desktop Search**: Inline search bar with dropdown trending searches
- **Trending Searches**: Both mobile and desktop show the same trending search terms
- **Search Interactions**: 
  - Click outside to close dropdown
  - Press Escape key to close dropdown
  - Clear search with X button
  - Click trending search terms to populate search field

### Trending Search Terms
- Chocolate Cake, Red Velvet, Black Forest, Birthday Cake
- Anniversary Cake, Wedding Cake, Photo Cake, Designer Cake
- Fondant Cake, Cupcakes

### Responsive Design
- Mobile-first approach with hamburger menu
- Desktop layout with expanded navigation
- Sticky header with scroll effects
- Location picker with pincode validation

### Categories & Navigation
- Expandable category menu with subcategories
- Color-coded category sections
- Useful links section
- Smooth animations and transitions

## Technology Stack
- **Frontend**: Next.js 14, React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Ready for Vercel deployment

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Search Implementation Details

### Desktop Search
- Located in the header between logo and location picker
- Shows trending searches dropdown on focus
- 4-column grid layout for trending search buttons
- Close (X) button in dropdown header for easy dismissal
- Smooth animations and hover effects

### Mobile Search
- Full-screen overlay triggered by search icon
- Same trending searches as desktop
- Responsive button layout
- Integrated with mobile navigation

Both search implementations use the same `trendingSearches` array for consistency across devices.
