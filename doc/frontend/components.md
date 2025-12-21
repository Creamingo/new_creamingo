# Frontend Components

## 🧩 Component Architecture

The Creamingo frontend uses a component-based architecture with reusable, modular components. Each component is designed to be self-contained with clear props interfaces and consistent styling patterns.

## 📋 Component Categories

### Layout Components

#### Header Component
**File**: `src/components/Header.js`

The main navigation component that provides site-wide navigation and search functionality.

```javascript
const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Component implementation
};
```

**Features**:
- Responsive navigation menu
- Global search with trending suggestions
- Location-based delivery selection
- Mobile hamburger menu
- Category dropdown navigation
- User authentication state

**Props**: None (uses internal state and context)

**State Management**:
- `isScrolled`: Header shadow on scroll
- `isMobileMenuOpen`: Mobile menu visibility
- `searchQuery`: Search input value
- `isSearchOpen`: Search dropdown visibility
- `pincode`: Delivery location input
- `expandedCategories`: Category menu expansion

#### Mobile Footer Component
**File**: `src/components/MobileFooter.js`

Mobile-optimized footer with quick actions and navigation.

```javascript
const MobileFooter = ({ cartItemCount, walletAmount, wishlistCount }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      {/* Footer implementation */}
    </footer>
  );
};
```

**Props**:
- `cartItemCount` (number): Number of items in cart
- `walletAmount` (number): User's wallet balance
- `wishlistCount` (number): Number of wishlist items

**Features**:
- Shopping cart access
- Wallet balance display
- Wishlist management
- Quick navigation links
- Fixed bottom positioning

### Product Components

#### ProductCard Component
**File**: `src/components/ProductCard.tsx`

Reusable component for displaying individual products with consistent styling and functionality.

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  base_weight: string;
  discount_percent: number;
  discounted_price: number;
  image: string;
  category: string;
  subcategory?: string;
  isTopProduct?: boolean;
  isBestseller?: boolean;
  variants?: ProductVariant[];
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  showBadges?: boolean;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleFavorite,
  showBadges = true,
  className = ''
}) => {
  // Component implementation
};
```

**Props**:
- `product` (Product): Product data object
- `onAddToCart` (function): Callback for add to cart action
- `onToggleFavorite` (function): Callback for wishlist toggle
- `showBadges` (boolean): Whether to show product badges
- `className` (string): Additional CSS classes

**Features**:
- Product image with hover effects
- Price display with discount calculation
- Product badges (Top Product, Bestseller)
- Add to cart button
- Wishlist toggle
- Responsive design
- Loading states

#### TopProducts Component
**File**: `src/components/TopProducts.tsx`

Displays featured top products in a responsive grid layout.

```typescript
interface TopProductsProps {
  products?: Product[];
  loading?: boolean;
  showViewAll?: boolean;
}

const TopProducts: React.FC<TopProductsProps> = ({ 
  products: propProducts, 
  loading: propLoading = false, 
  showViewAll = true 
}) => {
  const [products, setProducts] = useState<Product[]>(propProducts || []);
  const [loading, setLoading] = useState(propLoading);

  // Component implementation
};
```

**Props**:
- `products` (Product[]): Array of top products (optional)
- `loading` (boolean): Loading state
- `showViewAll` (boolean): Whether to show "View All" button

**Features**:
- API integration for fetching top products
- Responsive grid layout (2 columns mobile, 5 desktop)
- Loading skeleton states
- Product ranking badges
- Hover effects and animations
- View all functionality

#### Bestsellers Component
**File**: `src/components/Bestsellers.tsx`

Horizontal scrollable display for bestseller products.

```typescript
const Bestsellers: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Component implementation
};
```

**Features**:
- Horizontal scrollable layout
- Award badges for bestsellers
- Scroll navigation buttons
- API integration
- Responsive design
- Loading states

### Search and Discovery Components

#### CakeFinder Component
**File**: `src/components/CakeFinder.js`

Advanced product search and filtering component.

```javascript
const CakeFinder = () => {
  const [searchCriteria, setSearchCriteria] = useState({
    occasion: '',
    priceRange: '',
    weight: '',
    category: ''
  });
  
  // Component implementation
};
```

**Features**:
- Occasion-based search
- Price range filtering
- Weight-based selection
- Category filtering
- Search results display
- Filter combination logic

#### CategoryButton Component
**File**: `src/components/CategoryButton.js`

Reusable button component for category navigation.

```javascript
const CategoryButton = ({ category, onClick, isActive }) => {
  return (
    <button
      onClick={() => onClick(category)}
      className={`category-button ${isActive ? 'active' : ''}`}
    >
      {/* Button implementation */}
    </button>
  );
};
```

**Props**:
- `category` (object): Category data
- `onClick` (function): Click handler
- `isActive` (boolean): Active state

**Features**:
- Visual category representation
- Hover effects
- Active state styling
- Responsive design
- Icon integration

### Content Components

#### Testimonials Component
**File**: `src/components/Testimonials.js`

Customer reviews and testimonials carousel.

```javascript
const Testimonials = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const testimonials = [
    // Testimonial data
  ];
  
  // Component implementation
};
```

**Features**:
- Carousel/slider functionality
- Customer photos and reviews
- Star ratings display
- Responsive layout
- Auto-play option
- Navigation controls

#### CenterSlider Component
**File**: `src/components/CenterSlider.js`

Hero banner and promotional content slider.

```javascript
const CenterSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    // Slide data
  ];
  
  // Component implementation
};
```

**Features**:
- Image carousel
- Call-to-action buttons
- Responsive images
- Auto-play functionality
- Slide indicators
- Navigation arrows

### Utility Components

#### ViewAllButton Component
**File**: `src/components/ViewAllButton.js`

Reusable button for "View All" functionality.

```javascript
const ViewAllButton = ({ onClick, count, label }) => {
  return (
    <button
      onClick={onClick}
      className="view-all-button"
    >
      {label} ({count})
    </button>
  );
};
```

**Props**:
- `onClick` (function): Click handler
- `count` (number): Number of items
- `label` (string): Button label

#### MobileViewAllCard Component
**File**: `src/components/MobileViewAllCard.js`

Mobile-optimized card for "View All" functionality.

```javascript
const MobileViewAllCard = ({ title, count, onClick }) => {
  return (
    <div className="mobile-view-all-card" onClick={onClick}>
      {/* Card implementation */}
    </div>
  );
};
```

## 🎨 Component Styling Patterns

### CSS Classes and Utilities

#### Component Base Classes
```css
/* Base component styling */
.component-base {
  @apply bg-white rounded-2xl shadow-soft border border-gray-100;
}

.component-hover {
  @apply hover:shadow-soft-lg transition-all duration-300;
}

.component-active {
  @apply bg-gradient-to-r from-primary-500 to-primary-600 text-white;
}
```

#### Responsive Design Classes
```css
/* Mobile-first responsive classes */
.mobile-grid {
  @apply grid grid-cols-2 gap-4;
}

.tablet-grid {
  @apply md:grid-cols-3 md:gap-6;
}

.desktop-grid {
  @apply lg:grid-cols-5 lg:gap-8;
}
```

#### Animation Classes
```css
/* Hover animations */
.hover-scale {
  @apply transform transition-transform duration-300 hover:scale-105;
}

.hover-fade {
  @apply transition-opacity duration-300 hover:opacity-80;
}

.slide-in {
  @apply transform transition-transform duration-500 ease-out;
}
```

### Component Variants

#### Button Variants
```javascript
const buttonVariants = {
  primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50',
  ghost: 'text-gray-600 hover:bg-gray-100'
};
```

#### Card Variants
```javascript
const cardVariants = {
  default: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-lg border-0',
  outlined: 'bg-transparent border-2 border-gray-300',
  filled: 'bg-gray-50 border border-gray-200'
};
```

## 🔄 State Management Patterns

### Local State Management

#### useState Pattern
```javascript
const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Component logic
};
```

#### useReducer Pattern
```javascript
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.id) };
    case 'UPDATE_QUANTITY':
      return { ...state, items: state.items.map(item => 
        item.id === action.id ? { ...item, quantity: action.quantity } : item
      )};
    default:
      return state;
  }
};

const CartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  
  return (
    <CartContext.Provider value={{ cartState, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};
```

### Context Pattern
```javascript
const ProductContext = createContext();

const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ProductContext.Provider value={{
      products,
      loading,
      error,
      fetchProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
};
```

## 🎯 Component Composition

### Higher-Order Components

#### withLoading HOC
```javascript
const withLoading = (WrappedComponent) => {
  return ({ loading, ...props }) => {
    if (loading) {
      return <LoadingSkeleton />;
    }
    return <WrappedComponent {...props} />;
  };
};

const ProductCardWithLoading = withLoading(ProductCard);
```

#### withErrorBoundary HOC
```javascript
const withErrorBoundary = (WrappedComponent) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error) {
      return { hasError: true };
    }
    
    render() {
      if (this.state.hasError) {
        return <ErrorFallback />;
      }
      return <WrappedComponent {...this.props} />;
    }
  };
};
```

### Render Props Pattern
```javascript
const DataFetcher = ({ children, url }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [url]);
  
  return children({ data, loading, error });
};

// Usage
<DataFetcher url="/api/products">
  {({ data, loading, error }) => (
    loading ? <LoadingSpinner /> :
    error ? <ErrorMessage error={error} /> :
    <ProductList products={data} />
  )}
</DataFetcher>
```

## 🧪 Component Testing

### Testing Setup
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    base_price: 25.99,
    image: 'test-image.jpg'
  };
  
  test('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$25.99')).toBeInTheDocument();
  });
  
  test('calls onAddToCart when button is clicked', () => {
    const mockOnAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

### Component Testing Patterns

#### Props Testing
```javascript
test('applies custom className', () => {
  render(<ProductCard product={mockProduct} className="custom-class" />);
  
  const card = screen.getByTestId('product-card');
  expect(card).toHaveClass('custom-class');
});
```

#### State Testing
```javascript
test('toggles favorite state', () => {
  const mockOnToggleFavorite = jest.fn();
  render(<ProductCard product={mockProduct} onToggleFavorite={mockOnToggleFavorite} />);
  
  const favoriteButton = screen.getByTestId('favorite-button');
  fireEvent.click(favoriteButton);
  
  expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockProduct);
});
```

#### Integration Testing
```javascript
test('integrates with cart context', () => {
  const CartProvider = ({ children }) => (
    <CartContext.Provider value={{ addToCart: jest.fn() }}>
      {children}
    </CartContext.Provider>
  );
  
  render(
    <CartProvider>
      <ProductCard product={mockProduct} />
    </CartProvider>
  );
  
  // Test cart integration
});
```

## 📱 Responsive Component Patterns

### Mobile-First Design
```javascript
const ResponsiveGrid = ({ children }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
      {children}
    </div>
  );
};
```

### Breakpoint-Specific Components
```javascript
const ResponsiveComponent = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile ? <MobileVersion /> : <DesktopVersion />;
};
```

### Adaptive Layouts
```javascript
const AdaptiveLayout = ({ children }) => {
  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {children}
        </div>
        <div className="lg:col-span-1">
          <Sidebar />
        </div>
      </div>
    </div>
  );
};
```

## 🚀 Performance Optimization

### Component Optimization

#### React.memo
```javascript
const ProductCard = React.memo(({ product, onAddToCart }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.base_price === nextProps.product.base_price;
});
```

#### useMemo and useCallback
```javascript
const ProductList = ({ products, onAddToCart }) => {
  const sortedProducts = useMemo(() => {
    return products.sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);
  
  const handleAddToCart = useCallback((product) => {
    onAddToCart(product);
  }, [onAddToCart]);
  
  return (
    <div>
      {sortedProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
};
```

#### Lazy Loading
```javascript
const LazyProductModal = lazy(() => import('./ProductModal'));

const ProductCard = ({ product }) => {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <div onClick={() => setShowModal(true)}>
        {/* Product card content */}
      </div>
      {showModal && (
        <Suspense fallback={<LoadingSpinner />}>
          <LazyProductModal product={product} onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </>
  );
};
```

This comprehensive component documentation covers all aspects of the Creamingo frontend components, from basic structure and props to advanced patterns like HOCs, testing, and performance optimization.