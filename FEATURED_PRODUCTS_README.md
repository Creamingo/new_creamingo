# Featured Products Feature - Creamingo Admin Panel

## Overview
The "Top Products" and "Bestsellers" feature allows administrators to manage which products are prominently displayed in special sections on the homepage. This feature provides a way to highlight the most popular and highly-rated products to customers.

## Features Implemented

### 🗄️ Database
- **Table**: `featured_products`
- **Columns**:
  - `id` - Primary key
  - `product_id` - Foreign key to products table
  - `section` - Section type ('top_products' or 'bestsellers')
  - `display_order` - Order of display (0-based)
  - `is_active` - Whether the product is active
  - `created_at` - Creation timestamp
  - `updated_at` - Last update timestamp
- **Constraints**:
  - Unique product per section
  - **Section limits**: Top Products (max 5), Bestsellers (max 10)
  - Non-negative display order

### 🔧 Backend API (Node.js + Express + PostgreSQL)

#### Endpoints:
- `GET /api/featured-products?section=top_products` - Get all Top Products in order
- `GET /api/featured-products?section=bestsellers` - Get all Bestsellers in order
- `GET /api/featured-products/:id` - Get single featured product
- `GET /api/featured-products/available?section=top_products` - Get available products for Top Products
- `GET /api/featured-products/available?section=bestsellers` - Get available products for Bestsellers
- `GET /api/featured-products/stats` - Get section statistics
- `POST /api/featured-products` - Assign product to section (Super Admin only)
- `PUT /api/featured-products/:id` - Update display order or status (Super Admin only)
- `DELETE /api/featured-products/:id` - Remove from featured list (Super Admin only)

#### Security:
- JWT authentication required for all routes
- Only `super_admin` role can modify featured products
- Input validation using Joi schemas
- **Section-specific limits**: Top Products (max 5), Bestsellers (max 10)

### 🎨 Frontend (React + Tailwind CSS)

#### Admin Panel Components:
- **FeaturedProducts Page** - Main management interface
- **Section Selector** - Toggle between Top Products and Bestsellers
- **Stats Cards** - Display total, active, and available counts
- **Products Table** - List all featured products with actions
- **Add Modal** - Form to add new featured products
- **Edit Modal** - Form to update display order and status
- **Drag & Drop** - Reorder products with up/down arrows

#### Homepage Components:
- **TopProducts Component** - Responsive display for Top Products
- **Bestsellers Component** - Horizontal scrollable display for Bestsellers

#### Features:
- **Role-based Access** - Only Super Admin can access
- **Section Management** - Separate management for Top Products and Bestsellers
- **Real-time Updates** - Immediate UI updates after actions
- **Section-specific Validation** - Different limits for each section
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode Support** - Full dark/light theme compatibility

## File Structure

```
backend/
├── database/migrations/
│   └── 002_create_featured_products.sql
├── src/
│   ├── controllers/
│   │   └── featuredProductController.js
│   ├── routes/
│   │   └── featuredProductRoutes.js
│   ├── middleware/
│   │   └── validation.js (updated)
│   └── app.js (updated)

admin-panel/
├── src/
│   ├── pages/
│   │   └── FeaturedProducts.tsx
│   ├── components/layout/
│   │   └── Sidebar.tsx (updated)
│   ├── utils/
│   │   └── permissions.ts (updated)
│   └── App.tsx (updated)

frontend/
├── src/
│   └── components/
│       ├── TopProducts.tsx
│       └── Bestsellers.tsx
```

## Installation & Setup

### 1. Database Migration
```sql
-- Run the migration file
psql -d creamingo_db -f backend/database/migrations/002_create_featured_products.sql
```

### 2. Backend Dependencies
```bash
cd backend
npm install
```

### 3. Frontend Dependencies
```bash
cd admin-panel
npm install

cd ../frontend
npm install
```

### 4. Environment Variables
```env
# backend/.env
DATABASE_URL=postgresql://username:password@localhost:5432/creamingo_db
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Usage

### For Super Admins:
1. **Access**: Navigate to "Featured Products" in the sidebar
2. **Select Section**: Choose between "Top Products" or "Bestsellers"
3. **Add Product**: Click "Add Product" button, select from available products
4. **Reorder**: Use up/down arrows to change display order
5. **Edit**: Click edit icon to modify order or toggle active status
6. **Remove**: Click delete icon to remove from featured list

### For Staff:
- Staff members cannot access the Featured Products section
- They can only view products and manage orders

## API Examples

### Get Top Products
```bash
curl -X GET "http://localhost:5000/api/featured-products?section=top_products"
```

### Get Bestsellers
```bash
curl -X GET "http://localhost:5000/api/featured-products?section=bestsellers"
```

### Add Featured Product
```bash
curl -X POST http://localhost:5000/api/featured-products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "product_id": 1,
    "section": "top_products",
    "display_order": 0
  }'
```

### Update Featured Product
```bash
curl -X PUT http://localhost:5000/api/featured-products/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "display_order": 2,
    "is_active": true
  }'
```

## Permissions

### Super Admin Permissions:
- `featured-products.view` - View featured products
- `featured-products.create` - Add new featured products
- `featured-products.edit` - Update featured products
- `featured-products.delete` - Remove featured products

### Staff Permissions:
- No access to featured products management

## Validation Rules

### Backend Validation:
- Product ID must exist in products table
- Product cannot be already featured in the same section
- **Section limits**: Top Products (max 5), Bestsellers (max 10)
- Display order must be non-negative integer
- JWT token required for modifications
- Section validation (must be 'top_products' or 'bestsellers')

### Frontend Validation:
- **Section-specific limits**: Top Products (max 5), Bestsellers (max 10)
- Required field validation
- Real-time feedback for user actions
- Section-specific error messages

## Homepage Display

### Top Products Section:
- **Mobile** (< 768px): 2×2 grid showing max 4 products
- **Desktop** (≥ 768px): Horizontal row showing max 5 products
- **Features**: Star badges, hover effects, responsive design

### Bestsellers Section:
- **All Devices**: Horizontal scrollable display
- **Features**: Award badges, scroll buttons, up to 10 products
- **Navigation**: Left/right scroll buttons with smooth scrolling

## Error Handling

### Common Errors:
- **409 Conflict**: Product already featured in section
- **400 Bad Request**: Maximum products reached for section
- **404 Not Found**: Product or featured product not found
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Insufficient permissions (staff trying to modify)
- **400 Bad Request**: Invalid section (must be 'top_products' or 'bestsellers')

## Future Enhancements

### Potential Improvements:
1. **Drag & Drop Reordering** - Visual drag and drop interface
2. **Bulk Operations** - Select multiple products for batch actions
3. **Product Analytics** - Track which featured products perform best
4. **Scheduled Changes** - Set featured products to change automatically
5. **A/B Testing** - Test different featured product combinations
6. **Image Management** - Upload custom images for featured products
7. **Mobile App Integration** - API endpoints for mobile app consumption
8. **Performance Metrics** - Track views, clicks, and conversions

## Testing

### Manual Testing:
1. **Add Product**: Test adding products to both sections
2. **Reorder**: Test up/down arrow functionality
3. **Edit**: Test updating display order and status
4. **Delete**: Test removing products from featured list
5. **Permissions**: Test with both Super Admin and Staff accounts
6. **Validation**: Test section-specific limits
7. **Responsive**: Test on different screen sizes
8. **Homepage**: Test responsive display on frontend

### API Testing:
```bash
# Test all endpoints with proper authentication
# Verify error handling for invalid requests
# Test rate limiting and security measures
# Test section-specific validation
```

## Troubleshooting

### Common Issues:
1. **Database Connection**: Ensure PostgreSQL is running and accessible
2. **JWT Token**: Verify token is valid and not expired
3. **Permissions**: Check user role and permissions
4. **CORS**: Ensure CORS is configured for frontend domain
5. **Port Conflicts**: Verify ports 3000, 3001, and 5000 are available
6. **Section Limits**: Verify section-specific limits are enforced

### Debug Steps:
1. Check browser console for frontend errors
2. Check backend logs for API errors
3. Verify database connection and table structure
4. Test API endpoints with Postman or curl
5. Check network tab for failed requests
6. Verify section parameter in API calls

## Support

For issues or questions regarding the Featured Products feature:
1. Check the console logs for error messages
2. Verify all dependencies are installed
3. Ensure database migration was run successfully
4. Test with Super Admin account for full access
5. Review the API documentation for proper usage
6. Check section-specific validation rules

---

**Note**: This feature is designed to work seamlessly with the existing Creamingo admin panel and follows the same design patterns and security measures. The homepage components are responsive and optimized for both mobile and desktop viewing experiences.
