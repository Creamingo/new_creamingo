# Creamingo - Complete Cake Ordering Platform

A comprehensive cake ordering platform with customer-facing frontend, admin panel, and backend services.

## Project Structure

```
creamingo/
├── frontend/                     # Customer-facing website (Next.js)
├── admin-panel/                  # Admin panel frontend (React/Next.js + Tailwind + shadcn)
├── backend/                      # Custom backend (Express/NestJS + Prisma + PostgreSQL)
└── package.json                  # Monorepo configuration
```

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0 (install with: `npm install -g pnpm`)
- PostgreSQL (for backend)

### Installation

1. Install all dependencies:
```bash
pnpm run install:all
```

2. Start all services in development mode:
```bash
pnpm run dev
```

Or start individual services:
```bash
pnpm run dev:frontend    # Customer website
pnpm run dev:admin       # Admin panel
pnpm run dev:backend     # Backend API
```

### Individual Service Setup

#### Frontend (Customer Website)
- **Technology**: Next.js 14, React 18, Tailwind CSS
- **Port**: 3000
- **Directory**: `frontend/`

#### Admin Panel
- **Technology**: React/Next.js, Tailwind CSS, shadcn/ui
- **Port**: 3001
- **Directory**: `admin-panel/`

#### Backend
- **Technology**: Express/NestJS, Prisma, PostgreSQL
- **Port**: 8000
- **Directory**: `backend/`

## Development

### Available Scripts

- `pnpm run dev` - Start all services concurrently
- `pnpm run build` - Build all services
- `pnpm run install:all` - Install dependencies for all services
- `pnpm run clean` - Clean all node_modules

### Environment Variables

Each service has its own environment configuration. See individual service README files for details.

## Contributing

1. Create feature branches from `main`
2. Make changes in the appropriate service directory
3. Test changes across all services
4. Submit pull request

## License

Private - Creamingo Platform
