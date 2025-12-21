# Creamingo Backend API

A comprehensive backend API for the Creamingo cake ordering platform built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Admin and staff user management
- **Product Management**: Complete CRUD for products with variants
- **Category Management**: Hierarchical categories and subcategories
- **Order Management**: Full order lifecycle management
- **Customer Management**: Customer data and order history
- **File Uploads**: Image upload with multer
- **Payment Tracking**: Payment status and transaction management
- **Settings Management**: Configurable site settings
- **Banner Management**: Homepage banner management
- **Collection Management**: Product collections and curation

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Uploads**: Multer
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Environment**: dotenv

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── orderController.js
│   │   └── uploadController.js
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js           # JWT authentication
│   │   ├── role.js           # Role-based access control
│   │   ├── validation.js     # Request validation
│   │   ├── upload.js         # File upload handling
│   │   └── errorHandler.js   # Error handling
│   ├── routes/               # API routes
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── orderRoutes.js
│   │   └── uploadRoutes.js
│   ├── utils/                # Utility functions
│   ├── app.js                # Express app configuration
│   └── server.js             # Server entry point
├── database/
│   └── schema.sql            # Database schema
├── uploads/                  # File upload directory
├── package.json
├── env.example              # Environment variables template
└── README.md
```

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=creamingo_db
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Setup PostgreSQL database**
   ```bash
   # Create database
   createdb creamingo_db
   
   # Run schema
   psql -d creamingo_db -f database/schema.sql
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - Get all products (with pagination, filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/:id/variants` - Get product variants
- `POST /api/products/:id/variants` - Create product variant
- `PUT /api/products/:id/variants/:variantId` - Update variant
- `DELETE /api/products/:id/variants/:variantId` - Delete variant

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (super admin only)
- `PUT /api/categories/:id` - Update category (super admin only)
- `DELETE /api/categories/:id` - Delete category (super admin only)

### Orders
- `GET /api/orders` - Get all orders (with pagination, filters)
- `GET /api/orders/stats` - Get order statistics
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### File Uploads
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `GET /api/upload/:filename` - Get file info
- `DELETE /api/upload/:filename` - Delete file

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **super_admin**: Full access to all features
- **staff**: Limited access (can manage products, orders, customers)

### Default Credentials

- **Super Admin**: admin@creamingo.com / Creamingo@2427
- **Staff**: staff@creamingo.com / Creamingo@2427

## 📊 Database Schema

The database includes the following main tables:

- **users**: Admin and staff users
- **categories**: Product categories
- **subcategories**: Product subcategories
- **products**: Product information
- **product_variants**: Product size/weight variants
- **orders**: Customer orders
- **order_items**: Individual items in orders
- **customers**: Customer information
- **banners**: Homepage banners
- **collections**: Product collections
- **payments**: Payment transactions
- **settings**: Site configuration

## 🛡 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Joi validation
- **Password Hashing**: bcryptjs
- **JWT**: Secure token-based authentication
- **File Upload Security**: File type and size validation

## 🚀 Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production database
   - Set secure JWT secret
   - Configure CORS for production domain

2. **Database Migration**
   ```bash
   psql -d creamingo_db -f database/schema.sql
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

## 📝 API Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {
    // Response data
  }
}
```

## 🔍 Error Handling

The API includes comprehensive error handling:

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate entries)
- **413**: Payload Too Large (file size)
- **500**: Internal Server Error

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📈 Monitoring

- Health check endpoint: `GET /health`
- Database connection monitoring
- Error logging
- Request logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@creamingo.com or create an issue in the repository.
