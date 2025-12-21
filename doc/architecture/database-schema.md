# Database Schema

## 🗄️ Database Overview

The Creamingo platform uses a relational database design with SQLite for development and PostgreSQL for production. The schema is designed to support a comprehensive cake ordering platform with features for product management, order processing, user management, and featured content.

## 📊 Database Tables

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff', 'bakery_production', 'delivery_boy')),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Stores admin user accounts for the admin panel
**Key Features**:
- Role-based access control (super_admin, admin, staff, bakery_production, delivery_boy)
- Secure password storage with bcrypt hashing
- User activity tracking
- Soft delete capability with is_active flag

#### Categories Table
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Main product categories (e.g., Birthday Cakes, Wedding Cakes)
**Key Features**:
- Hierarchical organization with order_index
- Image support for category display
- Active/inactive status management

#### Subcategories Table
```sql
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Subdivisions of main categories (e.g., Chocolate, Vanilla under Birthday Cakes)
**Key Features**:
- Foreign key relationship to categories
- Cascade delete when parent category is removed
- Independent ordering within each category

#### Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL,
    base_price DECIMAL(10,2) NOT NULL,
    base_weight VARCHAR(50),
    discount_percent INTEGER DEFAULT 0,
    discounted_price DECIMAL(10,2),
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_top_product BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    allergens TEXT[] DEFAULT '{}',
    ingredients TEXT[] DEFAULT '{}',
    preparation_time INTEGER,
    serving_size VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Product catalog with comprehensive product information
**Key Features**:
- Flexible pricing with discount support
- Multiple product flags (featured, top, bestseller)
- Array fields for allergens and ingredients
- Preparation time and serving size information
- Restrict delete to prevent orphaned orders

#### Product Variants Table
```sql
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    weight VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_percent INTEGER DEFAULT 0,
    discounted_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Different sizes/weights of the same product
**Key Features**:
- Multiple pricing tiers per product
- Independent stock management
- Availability control per variant

#### Customers Table
```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Customer information for order processing
**Key Features**:
- JSONB address field for flexible address storage
- Contact information management
- Unique email constraint

#### Orders Table
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'preparing', 'ready', 
        'out_for_delivery', 'delivered', 'cancelled'
    )),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address JSONB NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time VARCHAR(20) NOT NULL,
    special_instructions TEXT,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'wallet')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Order management with complete lifecycle tracking
**Key Features**:
- Unique order number generation
- Comprehensive status tracking
- Flexible delivery information
- Payment method and status tracking

#### Order Items Table
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Individual items within an order
**Key Features**:
- Links to both products and variants
- Price snapshot at time of order
- Quantity validation

#### Payments Table
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(100),
    payment_gateway_response JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Payment tracking and transaction history
**Key Features**:
- Multiple payment attempts per order
- Gateway response storage
- Transaction ID tracking

### Featured Content Tables

#### Featured Categories Table
```sql
CREATE TABLE featured_categories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(category_id)
);
```

**Purpose**: Manages categories displayed on homepage
**Key Features**:
- Display order control
- One-to-one relationship with categories
- Active/inactive status

#### Featured Products Table
```sql
CREATE TABLE featured_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL CHECK (section IN ('top_products', 'bestsellers')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, section)
);
```

**Purpose**: Manages products displayed in homepage sections
**Key Features**:
- Section-based organization (top_products, bestsellers)
- Display order within each section
- Unique constraint per product per section

### System Tables

#### Settings Table
```sql
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: System configuration and settings
**Key Features**:
- Key-value storage with JSONB values
- Flexible configuration management
- Description for documentation

#### Banners Table
```sql
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(200),
    button_text VARCHAR(50),
    button_url TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Homepage banner management
**Key Features**:
- Call-to-action support
- Display order control
- Active/inactive status

#### Collections Table
```sql
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Product collections for curated displays
**Key Features**:
- Many-to-many relationship with products
- Display order control
- Collection-based product grouping

#### Collection Products Table
```sql
CREATE TABLE collection_products (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(collection_id, product_id)
);
```

**Purpose**: Many-to-many relationship between collections and products
**Key Features**:
- Junction table for collections and products
- Order control within collections
- Unique constraint prevents duplicates

## 🔗 Entity Relationships

### Primary Relationships

```
Users (1) ──── (M) Products (created by)
Categories (1) ──── (M) Subcategories
Categories (1) ──── (M) Products
Products (1) ──── (M) Product Variants
Products (1) ──── (M) Order Items
Products (M) ──── (M) Collections (via collection_products)
Customers (1) ──── (M) Orders
Orders (1) ──── (M) Order Items
Orders (1) ──── (M) Payments
Categories (1) ──── (1) Featured Categories
Products (1) ──── (1) Featured Products (per section)
```

### Relationship Details

#### One-to-Many Relationships
- **Categories → Subcategories**: A category can have multiple subcategories
- **Categories → Products**: A category can contain multiple products
- **Products → Product Variants**: A product can have multiple size/weight variants
- **Customers → Orders**: A customer can place multiple orders
- **Orders → Order Items**: An order can contain multiple items
- **Orders → Payments**: An order can have multiple payment attempts

#### Many-to-Many Relationships
- **Products ↔ Collections**: Products can belong to multiple collections, collections can contain multiple products

#### One-to-One Relationships
- **Categories ↔ Featured Categories**: Each category can be featured once
- **Products ↔ Featured Products**: Each product can be featured once per section

## 📈 Database Indexes

### Performance Indexes

```sql
-- User authentication
CREATE INDEX idx_users_email ON users(email);

-- Product queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_top ON products(is_top_product);
CREATE INDEX idx_products_bestseller ON products(is_bestseller);

-- Product variants
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_available ON product_variants(is_available);

-- Order processing
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);

-- Order items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Customer lookup
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Featured content
CREATE INDEX idx_featured_categories_order ON featured_categories(display_order);
CREATE INDEX idx_featured_products_section ON featured_products(section);
CREATE INDEX idx_featured_products_order ON featured_products(display_order);
```

## 🔄 Database Triggers

### Updated_at Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🚀 Database Migrations

### Migration System

The database uses a migration system to manage schema changes:

```
backend/database/migrations/
├── 001_create_featured_categories.sql
├── 002_create_featured_products.sql
├── 003_add_is_top_product_to_products.sql
├── 004_add_discount_fields_to_products.sql
├── 005_add_is_active_to_users.sql
└── 006_add_admin_role.sql
```

### Migration Features
- **Version Control**: Sequential migration numbering
- **Rollback Support**: Ability to rollback changes
- **Data Preservation**: Safe schema updates
- **Environment Consistency**: Same schema across environments

## 🔐 Data Security

### Security Measures

#### Access Control
- **Connection Encryption**: SSL/TLS for database connections
- **User Permissions**: Limited database user privileges
- **Environment Variables**: Secure credential management

#### Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: SQL injection prevention
- **Data Sanitization**: XSS protection in stored data
- **Audit Trail**: Created/updated timestamps

#### Backup Strategy
- **Regular Backups**: Automated daily backups
- **Point-in-time Recovery**: Transaction log backups
- **Cross-region Replication**: Disaster recovery
- **Data Retention**: Configurable retention policies

## 📊 Data Types and Constraints

### Key Data Types

#### Numeric Types
- **SERIAL**: Auto-incrementing primary keys
- **DECIMAL(10,2)**: Currency and price fields
- **INTEGER**: Counts, quantities, and IDs

#### Text Types
- **VARCHAR(n)**: Limited length strings
- **TEXT**: Unlimited length strings
- **JSONB**: Structured data storage

#### Boolean Types
- **BOOLEAN**: True/false flags
- **DEFAULT true/false**: Default values

#### Array Types
- **TEXT[]**: Arrays for allergens and ingredients

### Constraints

#### Check Constraints
- **Role Validation**: users.role IN ('super_admin', 'staff')
- **Status Validation**: orders.status IN ('pending', 'confirmed', ...)
- **Payment Method**: orders.payment_method IN ('cash', 'card', 'upi', 'wallet')

#### Unique Constraints
- **Email Uniqueness**: users.email, customers.email
- **Order Number**: orders.order_number
- **Featured Content**: featured_categories.category_id, featured_products(product_id, section)

#### Foreign Key Constraints
- **Cascade Deletes**: Child records deleted when parent is deleted
- **Restrict Deletes**: Prevents deletion of referenced records
- **Set Null**: Sets foreign key to NULL when parent is deleted

This database schema provides a robust foundation for the Creamingo platform, supporting all business requirements while maintaining data integrity, performance, and security.
