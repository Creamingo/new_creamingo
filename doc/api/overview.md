# API Overview

## 🔌 API Introduction

The Creamingo API is a RESTful web service built with Node.js and Express.js that provides comprehensive functionality for the cake ordering platform. The API serves both the customer-facing frontend and the administrative panel, offering secure, scalable, and well-documented endpoints.

## 🌐 Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.creamingo.com/api`

## 🔐 Authentication

The API uses JWT (JSON Web Token) based authentication for secure access control.

### Authentication Flow

1. **Login**: Send credentials to `/api/auth/login`
2. **Token**: Receive JWT token in response
3. **Authorization**: Include token in `Authorization` header for protected routes
4. **Refresh**: Token expires after 7 days (configurable)

### Authorization Header Format

```http
Authorization: Bearer <jwt_token>
```

### Example Authentication

```javascript
// Login request
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@creamingo.com',
    password: 'password123'
  })
});

const { data } = await response.json();
const token = data.token;

// Use token in subsequent requests
const productsResponse = await fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📋 API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total": 100,
      "total_pages": 10
    }
  }
}
```

## 🔒 Role-Based Access Control

The API implements role-based access control with two main roles:

### Super Admin
- Full access to all endpoints
- Can manage users, products, orders, and settings
- Can access featured content management
- Can perform system administration tasks

### Staff
- Limited access to operational endpoints
- Can view and manage products and orders
- Cannot access user management or system settings
- Cannot modify featured content

### Permission Examples

```javascript
// Super Admin only
POST /api/users
PUT /api/settings
DELETE /api/featured-categories

// Staff and Super Admin
GET /api/products
PUT /api/products/:id
GET /api/orders
PUT /api/orders/:id/status
```

## 📊 Rate Limiting

The API implements rate limiting to prevent abuse and ensure fair usage:

- **Limit**: 100 requests per 15-minute window per IP
- **Headers**: Rate limit information included in response headers
- **Exceeded**: Returns 429 Too Many Requests when limit exceeded

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🛡️ Security Features

### CORS Configuration
- Configured for specific origins
- Supports credentials
- Preflight request handling

### Input Validation
- Joi schema validation for all inputs
- SQL injection prevention
- XSS protection
- File upload restrictions

### Security Headers
- Helmet.js for security headers
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options

## 📁 File Upload

The API supports file uploads for product images and user avatars:

### Upload Endpoint
```
POST /api/upload
```

### Supported Formats
- **Images**: JPG, PNG, GIF, WebP
- **Max Size**: 10MB per file
- **Storage**: Local filesystem (configurable for cloud storage)

### Upload Example

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('type', 'product-image');

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## 🔍 Search and Filtering

Most list endpoints support advanced search and filtering:

### Query Parameters

#### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

#### Sorting
- `sort_by`: Field to sort by
- `sort_order`: `asc` or `desc` (default: `desc`)

#### Filtering
- `search`: Text search across relevant fields
- `is_active`: Filter by active status
- `category_id`: Filter by category
- `date_from` / `date_to`: Date range filtering

### Example Query

```javascript
const params = new URLSearchParams({
  page: 1,
  limit: 20,
  sort_by: 'created_at',
  sort_order: 'desc',
  search: 'chocolate',
  is_active: 'true',
  category_id: '1'
});

const response = await fetch(`/api/products?${params}`);
```

## 📈 API Endpoints Overview

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - User logout

### Product Endpoints
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/top` - Get top products
- `GET /api/products/bestsellers` - Get bestsellers

### Category Endpoints
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category details
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Order Endpoints
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status

### User Endpoints
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Featured Content Endpoints
- `GET /api/featured-categories` - List featured categories
- `POST /api/featured-categories` - Add featured category
- `PUT /api/featured-categories/:id` - Update featured category
- `DELETE /api/featured-categories/:id` - Remove featured category
- `GET /api/featured-products` - List featured products
- `POST /api/featured-products` - Add featured product
- `PUT /api/featured-products/:id` - Update featured product
- `DELETE /api/featured-products/:id` - Remove featured product

### System Endpoints
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings
- `POST /api/upload` - File upload
- `GET /health` - Health check

## 🚀 API Versioning

The API uses URL-based versioning:

- **Current Version**: v1 (default)
- **Future Versions**: v2, v3, etc.
- **Backward Compatibility**: Maintained for at least 2 versions

### Versioning Example

```javascript
// Current version (default)
GET /api/products

// Explicit version
GET /api/v1/products

// Future version
GET /api/v2/products
```

## 📝 Error Codes

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Custom Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Login credentials are invalid |
| `USER_NOT_FOUND` | User does not exist |
| `PRODUCT_NOT_FOUND` | Product does not exist |
| `ORDER_NOT_FOUND` | Order does not exist |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Request data validation failed |
| `DUPLICATE_ENTRY` | Resource already exists |
| `FILE_TOO_LARGE` | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE` | Uploaded file type not supported |

## 🔧 Development Tools

### API Testing

#### Postman Collection
A comprehensive Postman collection is available for testing all endpoints:
- Import the collection from `/docs/postman/creamingo-api.json`
- Set up environment variables for different stages
- Use pre-request scripts for authentication

#### cURL Examples
All endpoints include cURL examples in their documentation for easy testing.

### API Documentation
- **Interactive Docs**: Available at `/api/docs` (Swagger/OpenAPI)
- **Postman Collection**: Importable collection with examples
- **cURL Examples**: Command-line examples for each endpoint

## 📊 Monitoring and Analytics

### Health Check
```
GET /health
```

Returns system health status and basic metrics.

### Logging
- **Request Logging**: All API requests are logged
- **Error Logging**: Detailed error information
- **Performance Logging**: Response time tracking
- **Security Logging**: Authentication and authorization events

### Metrics
- **Response Times**: Average and percentile response times
- **Error Rates**: Error rate by endpoint
- **Usage Statistics**: API usage patterns
- **Authentication Metrics**: Login success/failure rates

## 🚀 Performance Optimization

### Caching
- **Response Caching**: Frequently accessed data cached
- **Database Query Caching**: Optimized database queries
- **Static Asset Caching**: CDN integration for file uploads

### Database Optimization
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed queries and optimized joins
- **Pagination**: Efficient large dataset handling

### Response Optimization
- **Compression**: Gzip compression for responses
- **Minification**: JSON response optimization
- **Lazy Loading**: On-demand data loading

This API overview provides a comprehensive introduction to the Creamingo API, covering authentication, security, endpoints, and development tools. For detailed endpoint documentation, refer to the specific API sections in this documentation.
