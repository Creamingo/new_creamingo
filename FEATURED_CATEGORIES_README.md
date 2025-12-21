# Featured Categories Feature - Creamingo Admin Panel

## Overview
The "Most Loved Categories" feature allows administrators to manage which categories are prominently displayed on the homepage. This feature provides a way to highlight the most popular or important categories to customers.

## Features Implemented

### 🗄️ Database
- **Table**: `featured_categories`
- **Columns**:
  - `id` - Primary key
  - `category_id` - Foreign key to categories table
  - `display_order` - Order of display (0-based)
  - `is_active` - Whether the category is active
  - `created_at` - Creation timestamp
  - `updated_at` - Last update timestamp
- **Constraints**:
  - Unique category per featured list
  - **Responsive limits**: 6 categories for mobile/tablet, 7 for desktop
  - Non-negative display order

### 🔧 Backend API (Node.js + Express + PostgreSQL)

#### Endpoints:
- `GET /api/featured-categories` - Get all featured categories with category details
- `GET /api/featured-categories/:id` - Get single featured category
- `GET /api/featured-categories/available` - Get categories not yet featured
- `POST /api/featured-categories` - Add category to featured list (Super Admin only)
- `PUT /api/featured-categories/:id` - Update display order or status (Super Admin only)
- `DELETE /api/featured-categories/:id` - Remove from featured list (Super Admin only)

#### Security:
- JWT authentication required for all routes
- Only `super_admin` role can modify featured categories
- Input validation using Joi schemas
- **Responsive limits**: 6 categories for mobile/tablet, 7 for desktop

### 🎨 Frontend (React + Tailwind CSS)

#### Components:
- **FeaturedCategories Page** - Main management interface
- **Stats Cards** - Display total, active, and available counts
- **Categories Table** - List all featured categories with actions
- **Add Modal** - Form to add new featured categories
- **Edit Modal** - Form to update display order and status
- **Drag & Drop** - Reorder categories with up/down arrows

#### Features:
- **Role-based Access** - Only Super Admin can access
- **Real-time Updates** - Immediate UI updates after actions
- **Responsive Validation** - Device-specific limits (6 for mobile/tablet, 7 for desktop)
- **Device Detection** - Automatic detection of device type with visual indicators
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode Support** - Full dark/light theme compatibility

## File Structure

```
backend/
├── database/migrations/
│   └── 001_create_featured_categories.sql
├── src/
│   ├── controllers/
│   │   └── featuredCategoryController.js
│   ├── routes/
│   │   └── featuredCategoryRoutes.js
│   ├── middleware/
│   │   └── validation.js (updated)
│   └── app.js (updated)

admin-panel/
├── src/
│   ├── pages/
│   │   └── FeaturedCategories.tsx
│   ├── components/layout/
│   │   └── Sidebar.tsx (updated)
│   ├── utils/
│   │   ├── permissions.ts (updated)
│   │   └── deviceDetection.ts (new)
│   └── App.tsx (updated)
```

## Installation & Setup

### 1. Database Migration
```sql
-- Run the migration file
psql -d creamingo_db -f backend/database/migrations/001_create_featured_categories.sql
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
1. **Access**: Navigate to "Featured Categories" in the sidebar
2. **Add Category**: Click "Add Category" button, select from available categories
3. **Reorder**: Use up/down arrows to change display order
4. **Edit**: Click edit icon to modify order or toggle active status
5. **Remove**: Click delete icon to remove from featured list

### For Staff:
- Staff members cannot access the Featured Categories section
- They can only view products and manage orders

## API Examples

### Get Featured Categories
```bash
curl -X GET http://localhost:5000/api/featured-categories
```

### Add Featured Category
```bash
curl -X POST http://localhost:5000/api/featured-categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "category_id": 1,
    "display_order": 0,
    "device_type": "mobile"
  }'
```

### Update Featured Category
```bash
curl -X PUT http://localhost:5000/api/featured-categories/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "display_order": 2,
    "is_active": true
  }'
```

## Permissions

### Super Admin Permissions:
- `featured-categories.view` - View featured categories
- `featured-categories.create` - Add new featured categories
- `featured-categories.edit` - Update featured categories
- `featured-categories.delete` - Remove featured categories

### Staff Permissions:
- No access to featured categories management

## Validation Rules

### Backend Validation:
- Category ID must exist in categories table
- Category cannot be already featured
- **Responsive limits**: 6 categories for mobile/tablet, 7 for desktop
- Display order must be non-negative integer
- JWT token required for modifications
- Device type validation (mobile, tablet, desktop)

### Frontend Validation:
- **Device-specific limits**: 6 for mobile/tablet, 7 for desktop
- Required field validation
- Real-time feedback for user actions
- Automatic device detection and limit adjustment

## Error Handling

### Common Errors:
- **409 Conflict**: Category already featured
- **400 Bad Request**: Maximum categories reached for device type
- **404 Not Found**: Category or featured category not found
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Insufficient permissions (staff trying to modify)
- **400 Bad Request**: Invalid device type (must be mobile, tablet, or desktop)

## Future Enhancements

### Potential Improvements:
1. **Drag & Drop Reordering** - Visual drag and drop interface
2. **Bulk Operations** - Select multiple categories for batch actions
3. **Category Analytics** - Track which featured categories perform best
4. **Scheduled Changes** - Set featured categories to change automatically
5. **A/B Testing** - Test different featured category combinations
6. **Image Management** - Upload custom images for featured categories
7. **Mobile App Integration** - API endpoints for mobile app consumption

## Testing

### Manual Testing:
1. **Add Category**: Test adding categories to featured list
2. **Reorder**: Test up/down arrow functionality
3. **Edit**: Test updating display order and status
4. **Delete**: Test removing categories from featured list
5. **Permissions**: Test with both Super Admin and Staff accounts
6. **Validation**: Test maximum 7 categories limit
7. **Responsive**: Test on different screen sizes

### API Testing:
```bash
# Test all endpoints with proper authentication
# Verify error handling for invalid requests
# Test rate limiting and security measures
```

## Troubleshooting

### Common Issues:
1. **Database Connection**: Ensure PostgreSQL is running and accessible
2. **JWT Token**: Verify token is valid and not expired
3. **Permissions**: Check user role and permissions
4. **CORS**: Ensure CORS is configured for frontend domain
5. **Port Conflicts**: Verify ports 3000, 3001, and 5000 are available

### Debug Steps:
1. Check browser console for frontend errors
2. Check backend logs for API errors
3. Verify database connection and table structure
4. Test API endpoints with Postman or curl
5. Check network tab for failed requests

## Support

For issues or questions regarding the Featured Categories feature:
1. Check the console logs for error messages
2. Verify all dependencies are installed
3. Ensure database migration was run successfully
4. Test with Super Admin account for full access
5. Review the API documentation for proper usage

---

**Note**: This feature is designed to work seamlessly with the existing Creamingo admin panel and follows the same design patterns and security measures.
