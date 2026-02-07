#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Creamingo Backend Installation Script');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envExample = fs.readFileSync(path.join(__dirname, 'env.example'), 'utf8');
  fs.writeFileSync(envPath, envExample);
  console.log('✅ .env file created. Please update it with your configuration.\n');
} else {
  console.log('✅ .env file already exists.\n');
}

// Check if gallery directories exist
const galleryPath = path.join(__dirname, '..', 'gallery');
const gallerySubdirs = ['products', 'categories', 'subcategories', 'banners', 'icons', 'misc'];
if (!fs.existsSync(galleryPath)) {
  console.log('📁 Creating gallery directory...');
  fs.mkdirSync(galleryPath, { recursive: true });
  console.log('✅ Gallery directory created.\n');
} else {
  console.log('✅ Gallery directory already exists.\n');
}

gallerySubdirs.forEach((dir) => {
  const subdirPath = path.join(galleryPath, dir);
  if (!fs.existsSync(subdirPath)) {
    fs.mkdirSync(subdirPath, { recursive: true });
  }
});

// Check if database directory exists
const dbPath = path.join(__dirname, 'database');
if (!fs.existsSync(dbPath)) {
  console.log('📁 Creating database directory...');
  fs.mkdirSync(dbPath, { recursive: true });
  console.log('✅ Database directory created.\n');
} else {
  console.log('✅ Database directory already exists.\n');
}

console.log('🎉 Installation completed!');
console.log('\nNext steps:');
console.log('1. Update .env file with your database credentials');
console.log('2. Create PostgreSQL database: createdb creamingo_db');
console.log('3. Run database schema: psql -d creamingo_db -f database/schema.sql');
console.log('4. Install dependencies: npm install');
console.log('5. Start the server: npm run dev');
console.log('\nDefault admin credentials:');
console.log('Email: admin@creamingo.com');
console.log('Password: Creamingo@2427');
console.log('\nHappy coding! 🍰');
