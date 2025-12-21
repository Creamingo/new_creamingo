# Creamingo Documentation

Welcome to the comprehensive documentation for the Creamingo cake ordering platform. This documentation covers all aspects of the system including architecture, API endpoints, frontend components, admin panel features, and deployment guides.

## 📚 Documentation Structure

### 🏗️ Architecture & Overview
- [Project Overview](architecture/overview.md) - High-level system architecture and components
- [System Architecture](architecture/system-architecture.md) - Detailed technical architecture
- [Database Schema](architecture/database-schema.md) - Complete database design and relationships
- [Technology Stack](architecture/technology-stack.md) - Technologies and frameworks used

### 🔌 API Documentation
- [API Overview](api/overview.md) - REST API introduction and authentication
- [Authentication](api/authentication.md) - JWT-based authentication system
- [Products API](api/products.md) - Product management endpoints
- [Categories API](api/categories.md) - Category and subcategory management
- [Orders API](api/orders.md) - Order processing and management
- [Users API](api/users.md) - User management and permissions
- [Featured Content API](api/featured-content.md) - Featured categories and products
- [Settings API](api/settings.md) - System configuration and settings

### 🎨 Frontend Documentation
- [Frontend Overview](frontend/overview.md) - Customer-facing website structure
- [Components](frontend/components.md) - React components and their usage
- [Pages](frontend/pages.md) - Page components and routing
- [Styling](frontend/styling.md) - Tailwind CSS and design system
- [State Management](frontend/state-management.md) - React hooks and context

### 👨‍💼 Admin Panel Documentation
- [Admin Overview](admin/overview.md) - Admin panel features and structure
- [Admin Features](admin/features.md) - Detailed feature documentation and usage guide

### 🚀 Deployment & Development
- [Setup & Deployment](deployment/setup.md) - Complete setup, configuration, and deployment guide

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0 (install with: `npm install -g pnpm`)
- SQLite (development) or PostgreSQL (production)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd creamingo_web

# Install all dependencies
pnpm run install:all

# Start all services
pnpm run dev
```

### Access URLs
- **Customer Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **Backend API**: http://localhost:5000

## 🏗️ System Architecture

Creamingo is a full-stack cake ordering platform consisting of three main applications:

1. **Frontend** (Next.js) - Customer-facing website
2. **Admin Panel** (React) - Administrative interface
3. **Backend** (Node.js/Express) - REST API and business logic

### Key Features
- 🍰 **Product Management** - Complete product catalog with variants
- 🛒 **Order Processing** - End-to-end order management
- 👥 **User Management** - Role-based access control
- ⭐ **Featured Content** - Dynamic homepage content management
- 📱 **Responsive Design** - Mobile-first approach
- 🔐 **Secure Authentication** - JWT-based security
- 📊 **Analytics Dashboard** - Business insights and reporting

## 📖 Getting Started

1. **For Developers**: Start with [Setup & Deployment](deployment/setup.md)
2. **For System Administrators**: See [Setup & Deployment](deployment/setup.md)
3. **For API Integration**: Check [API Overview](api/overview.md)
4. **For Frontend Development**: Read [Frontend Overview](frontend/overview.md)

## 🤝 Contributing

Please read our [Setup & Deployment](deployment/setup.md) guide before contributing to the project.

## 📞 Support

For technical support or questions:
- Check the [Setup & Deployment](deployment/setup.md) troubleshooting section
- Review the relevant documentation sections
- Create an issue in the project repository

---

**Last Updated**: January 2024  
**Version**: 1.0.0
