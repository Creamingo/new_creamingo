# Products API

## 🍰 Products API Overview

The Products API provides comprehensive functionality for managing the cake product catalog, including product information, variants, pricing, and inventory management. This API supports both customer-facing product browsing and administrative product management.

## 📋 Product Data Model

### Product Object Structure

```json
{
  "id": 1,
  "name": "Chocolate Delight Cake",
  "description": "Rich chocolate cake with chocolate ganache",
  "category_id": 1,
  "subcategory_id": 2,
  "base_price": 25.99,
  "base_weight": "1kg",
  "discount_percent": 15,
  "discounted_price": 22.09,
  "image_url": "https://example.com/chocolate-cake.jpg",
  "is_active": true,
  "is_featured": false,
  "is_top_product": true,
  "is_bestseller": false,
  "allergens": ["gluten", "dairy", "eggs"],
  "ingredients": ["flour", "sugar", "cocoa", "butter", "eggs"],
  "preparation_time": 30,
  "serving_size": "8-10 people",
  "category_name": "Birthday Cakes",
  "subcategory_name": "Chocolate",
  "variants": [
    {
      "id": 1,
      "name": "Small",
      "weight": "500g",
      "price": 15.99,
      "discount_percent": 15,
      "discounted_price": 13.59,
      "stock_quantity": 20,
      "is_available": true
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T00:00:00Z"
}
```

## 🔍 List Products

### Endpoint
```
GET /api/products
```

### Description
Retrieves a paginated list of products with optional filtering and sorting.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 10 | Number of items per page (max: 100) |
| `category_id` | integer | - | Filter by category ID |
| `subcategory_id` | integer | - | Filter by subcategory ID |
| `is_active` | boolean | - | Filter by active status |
| `is_featured` | boolean | - | Filter by featured status |
| `is_top_product` | boolean | - | Filter by top product status |
| `is_bestseller` | boolean | - | Filter by bestseller status |
| `search` | string | - | Search in name and description |
| `sort_by` | string | created_at | Sort field (name, base_price, created_at, updated_at) |
| `sort_order` | string | DESC | Sort order (ASC, DESC) |

### Example Request

```javascript
const response = await fetch('/api/products?page=1&limit=20&category_id=1&is_active=true&search=chocolate', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example Response

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Chocolate Delight Cake",
        "description": "Rich chocolate cake with chocolate ganache",
        "base_price": 25.99,
        "discounted_price": 22.09,
        "image_url": "https://example.com/chocolate-cake.jpg",
        "is_active": true,
        "is_top_product": true,
        "category_name": "Birthday Cakes",
        "subcategory_name": "Chocolate",
        "variants": [...]
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

## 🔍 Get Product Details

### Endpoint
```
GET /api/products/:id
```

### Description
Retrieves detailed information about a specific product including all variants.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Product ID |

### Example Request

```javascript
const response = await fetch('/api/products/1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example Response

```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Chocolate Delight Cake",
      "description": "Rich chocolate cake with chocolate ganache",
      "category_id": 1,
      "subcategory_id": 2,
      "base_price": 25.99,
      "base_weight": "1kg",
      "discount_percent": 15,
      "discounted_price": 22.09,
      "image_url": "https://example.com/chocolate-cake.jpg",
      "is_active": true,
      "is_featured": false,
      "is_top_product": true,
      "is_bestseller": false,
      "allergens": ["gluten", "dairy", "eggs"],
      "ingredients": ["flour", "sugar", "cocoa", "butter", "eggs"],
      "preparation_time": 30,
      "serving_size": "8-10 people",
      "category_name": "Birthday Cakes",
      "subcategory_name": "Chocolate",
      "variants": [
        {
          "id": 1,
          "name": "Small",
          "weight": "500g",
          "price": 15.99,
          "discount_percent": 15,
          "discounted_price": 13.59,
          "stock_quantity": 20,
          "is_available": true,
          "created_at": "2024-01-01T00:00:00Z"
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T00:00:00Z"
    }
  }
}
```

## ➕ Create Product

### Endpoint
```
POST /api/products
```

### Description
Creates a new product in the catalog. Requires authentication and appropriate permissions.

### Request Body

```json
{
  "name": "Vanilla Dream Cake",
  "description": "Classic vanilla cake with buttercream frosting",
  "category_id": 1,
  "subcategory_id": 3,
  "base_price": 22.99,
  "base_weight": "1kg",
  "discount_percent": 10,
  "image_url": "https://example.com/vanilla-cake.jpg",
  "is_active": true,
  "is_featured": false,
  "is_top_product": false,
  "is_bestseller": true,
  "allergens": ["gluten", "dairy", "eggs"],
  "ingredients": ["flour", "sugar", "vanilla", "butter", "eggs"],
  "preparation_time": 25,
  "serving_size": "8-10 people"
}
```

### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 1-200 characters |
| `description` | string | Yes | 1-1000 characters |
| `category_id` | integer | Yes | Must exist in categories table |
| `subcategory_id` | integer | No | Must exist and belong to category |
| `base_price` | decimal | Yes | Must be positive |
| `base_weight` | string | No | 1-50 characters |
| `discount_percent` | integer | No | 0-100 |
| `image_url` | string | Yes | Valid URL |
| `is_active` | boolean | No | Default: true |
| `is_featured` | boolean | No | Default: false |
| `is_top_product` | boolean | No | Default: false |
| `is_bestseller` | boolean | No | Default: false |
| `allergens` | array | No | Array of strings |
| `ingredients` | array | No | Array of strings |
| `preparation_time` | integer | No | Minutes, positive |
| `serving_size` | string | No | 1-50 characters |

### Example Request

```javascript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: "Vanilla Dream Cake",
    description: "Classic vanilla cake with buttercream frosting",
    category_id: 1,
    subcategory_id: 3,
    base_price: 22.99,
    base_weight: "1kg",
    discount_percent: 10,
    image_url: "https://example.com/vanilla-cake.jpg",
    is_active: true,
    allergens: ["gluten", "dairy", "eggs"],
    ingredients: ["flour", "sugar", "vanilla", "butter", "eggs"],
    preparation_time: 25,
    serving_size: "8-10 people"
  })
});
```

### Example Response

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": 2,
      "name": "Vanilla Dream Cake",
      "description": "Classic vanilla cake with buttercream frosting",
      "category_id": 1,
      "subcategory_id": 3,
      "base_price": 22.99,
      "base_weight": "1kg",
      "discount_percent": 10,
      "discounted_price": 20.69,
      "image_url": "https://example.com/vanilla-cake.jpg",
      "is_active": true,
      "is_featured": false,
      "is_top_product": false,
      "is_bestseller": true,
      "allergens": ["gluten", "dairy", "eggs"],
      "ingredients": ["flour", "sugar", "vanilla", "butter", "eggs"],
      "preparation_time": 25,
      "serving_size": "8-10 people",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

## ✏️ Update Product

### Endpoint
```
PUT /api/products/:id
```

### Description
Updates an existing product. Only provided fields will be updated.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Product ID |

### Request Body
Partial update - only include fields to be updated:

```json
{
  "name": "Updated Chocolate Delight Cake",
  "base_price": 27.99,
  "discount_percent": 20,
  "is_top_product": true
}
```

### Example Request

```javascript
const response = await fetch('/api/products/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: "Updated Chocolate Delight Cake",
    base_price: 27.99,
    discount_percent: 20,
    is_top_product: true
  })
});
```

### Example Response

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "id": 1,
      "name": "Updated Chocolate Delight Cake",
      "base_price": 27.99,
      "discount_percent": 20,
      "discounted_price": 22.39,
      "is_top_product": true,
      "updated_at": "2024-01-15T11:00:00Z"
    }
  }
}
```

## 🗑️ Delete Product

### Endpoint
```
DELETE /api/products/:id
```

### Description
Deletes a product from the catalog. Products with existing orders cannot be deleted.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Product ID |

### Example Request

```javascript
const response = await fetch('/api/products/1', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example Response

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Error Response (Product has orders)

```json
{
  "success": false,
  "message": "Cannot delete product that has been ordered. Consider deactivating it instead."
}
```

## ⭐ Top Products

### Endpoint
```
GET /api/products/top
```

### Description
Retrieves products marked as top products, ordered by ID.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Maximum number of products to return |

### Example Request

```javascript
const response = await fetch('/api/products/top?limit=5');
```

### Example Response

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Chocolate Delight Cake",
        "description": "Rich chocolate cake with chocolate ganache",
        "base_price": 25.99,
        "discounted_price": 22.09,
        "image_url": "https://example.com/chocolate-cake.jpg",
        "is_top_product": true,
        "category_name": "Birthday Cakes",
        "subcategory_name": "Chocolate"
      }
    ],
    "count": 1
  }
}
```

## 🏆 Bestsellers

### Endpoint
```
GET /api/products/bestsellers
```

### Description
Retrieves products marked as bestsellers, ordered by ID.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Maximum number of products to return |

### Example Request

```javascript
const response = await fetch('/api/products/bestsellers?limit=10');
```

### Example Response

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 2,
        "name": "Vanilla Dream Cake",
        "description": "Classic vanilla cake with buttercream frosting",
        "base_price": 22.99,
        "discounted_price": 20.69,
        "image_url": "https://example.com/vanilla-cake.jpg",
        "is_bestseller": true,
        "category_name": "Birthday Cakes",
        "subcategory_name": "Vanilla"
      }
    ],
    "count": 1
  }
}
```

## 🔄 Toggle Top Product Status

### Endpoint
```
PUT /api/products/:id/toggle-top
```

### Description
Toggles the top product status of a product. Automatically syncs with featured products.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Product ID |

### Example Request

```javascript
const response = await fetch('/api/products/1/toggle-top', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example Response

```json
{
  "success": true,
  "message": "Product marked as Top Product",
  "data": {
    "product": {
      "id": 1,
      "name": "Chocolate Delight Cake",
      "is_top_product": true,
      "updated_at": "2024-01-15T11:30:00Z"
    }
  }
}
```

## 🏆 Toggle Bestseller Status

### Endpoint
```
PUT /api/products/:id/toggle-bestseller
```

### Description
Toggles the bestseller status of a product. Automatically syncs with featured products.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Product ID |

### Example Request

```javascript
const response = await fetch('/api/products/1/toggle-bestseller', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example Response

```json
{
  "success": true,
  "message": "Product marked as Bestseller",
  "data": {
    "product": {
      "id": 1,
      "name": "Chocolate Delight Cake",
      "is_bestseller": true,
      "updated_at": "2024-01-15T11:30:00Z"
    }
  }
}
```

## 📦 Product Variants Management

### Get Product Variants

#### Endpoint
```
GET /api/products/:id/variants
```

#### Description
Retrieves all variants for a specific product.

#### Example Request

```javascript
const response = await fetch('/api/products/1/variants', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "variants": [
      {
        "id": 1,
        "product_id": 1,
        "name": "Small",
        "weight": "500g",
        "price": 15.99,
        "discount_percent": 15,
        "discounted_price": 13.59,
        "stock_quantity": 20,
        "is_available": true,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Create Product Variant

#### Endpoint
```
POST /api/products/:id/variants
```

#### Description
Creates a new variant for a product.

#### Request Body

```json
{
  "name": "Large",
  "weight": "2kg",
  "price": 45.99,
  "stock_quantity": 10,
  "is_available": true
}
```

#### Example Request

```javascript
const response = await fetch('/api/products/1/variants', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: "Large",
    weight: "2kg",
    price: 45.99,
    stock_quantity: 10,
    is_available: true
  })
});
```

### Update Product Variant

#### Endpoint
```
PUT /api/products/:id/variants/:variantId
```

#### Description
Updates an existing product variant.

#### Example Request

```javascript
const response = await fetch('/api/products/1/variants/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    price: 16.99,
    stock_quantity: 25
  })
});
```

### Delete Product Variant

#### Endpoint
```
DELETE /api/products/:id/variants/:variantId
```

#### Description
Deletes a product variant. Variants with existing orders cannot be deleted.

#### Example Request

```javascript
const response = await fetch('/api/products/1/variants/1', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🚨 Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Discount percent must be between 0 and 100"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "message": "Product with this name already exists"
}
```

#### 422 Unprocessable Entity
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "name": "Name is required",
      "base_price": "Base price must be a positive number"
    }
  }
}
```

## 🔒 Permissions

### Required Permissions

| Endpoint | Method | Permission Required |
|----------|--------|-------------------|
| `/api/products` | GET | Public (no auth required) |
| `/api/products/:id` | GET | Public (no auth required) |
| `/api/products/top` | GET | Public (no auth required) |
| `/api/products/bestsellers` | GET | Public (no auth required) |
| `/api/products` | POST | `products.create` |
| `/api/products/:id` | PUT | `products.edit` |
| `/api/products/:id` | DELETE | `products.delete` |
| `/api/products/:id/toggle-top` | PUT | `products.edit` |
| `/api/products/:id/toggle-bestseller` | PUT | `products.edit` |
| `/api/products/:id/variants` | GET | `products.view` |
| `/api/products/:id/variants` | POST | `products.edit` |
| `/api/products/:id/variants/:variantId` | PUT | `products.edit` |
| `/api/products/:id/variants/:variantId` | DELETE | `products.edit` |

### Role Access

- **Super Admin**: Full access to all product endpoints
- **Staff**: Can view and edit products, cannot delete products with orders
- **Public**: Can view products and product details

## 📊 Performance Considerations

### Optimization Features

- **Pagination**: Efficient handling of large product catalogs
- **Indexing**: Database indexes on frequently queried fields
- **Caching**: Response caching for frequently accessed products
- **Lazy Loading**: Variants loaded only when needed
- **Image Optimization**: CDN integration for product images

### Best Practices

1. **Use Pagination**: Always use pagination for product lists
2. **Filter Early**: Apply filters to reduce data transfer
3. **Cache Responses**: Cache product data on the client side
4. **Optimize Images**: Use appropriate image sizes and formats
5. **Batch Operations**: Use batch endpoints for multiple operations

This comprehensive Products API documentation covers all aspects of product management in the Creamingo platform, from basic CRUD operations to advanced features like variants and featured product management.
