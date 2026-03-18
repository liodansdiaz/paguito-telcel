# AGENTS.md - Coding Agent Guidelines

This document provides essential information for AI coding agents working on the Paguito Telcel project.

---

## Project Overview

**Paguito Telcel** is a web-based sales management system for Telcel mobile devices. It allows customers to browse catalogs, make online reservations, and receive home visits from sales representatives. Administrators manage inventory, reservations, and vendors from a centralized panel.

**Stack:**
- **Backend:** Node.js + TypeScript + Express + Prisma ORM + PostgreSQL
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand
- **Testing:** Vitest (backend)
- **Infrastructure:** Docker Compose for PostgreSQL

---

## Build, Lint, and Test Commands

### Backend (`/backend`)

```bash
# Development
npm run dev                    # Start dev server with hot-reload (ts-node-dev)

# Build
npm run build                  # Compile TypeScript to dist/
npm start                      # Run compiled build (production)

# Testing
npm test                       # Run all tests once
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Run tests with coverage report
vitest run <file>              # Run a single test file
vitest run -t "test name"      # Run specific test by name

# Database
npm run db:generate            # Generate Prisma client
npm run db:migrate             # Create and apply migrations
npm run db:push                # Sync schema without migration
npm run db:seed                # Seed database with test data
npm run db:studio              # Open Prisma Studio

# Security
npm run generate-secrets       # Generate secure JWT/Redis secrets
npm run env:validate           # Validate environment variables
```

### Frontend (`/frontend`)

```bash
# Development
npm run dev                    # Start Vite dev server

# Build
npm run build                  # TypeScript check + Vite build
npm run preview                # Preview production build

# Linting
npm run lint                   # Run ESLint
```

### Running Single Tests

To run a specific test file:
```bash
cd backend
npx vitest run src/__tests__/reservation.service.test.ts
```

To run a specific test case by name:
```bash
cd backend
npx vitest run -t "should assign vendor using round robin"
```

---

## Code Style Guidelines

### General Principles

- **Language:** Spanish for user-facing messages, comments, and variable names related to business logic
- **TypeScript:** Strict mode enabled in both backend and frontend
- **Formatting:** Follow the existing patterns in the codebase
- **No emojis:** Do not add emojis to code or comments

### Backend Conventions

#### File Structure

Each module follows the **Controller → Service → Repository** pattern:

```
src/modules/<module>/
├── <module>.controller.ts    # HTTP layer (request/response)
├── <module>.service.ts       # Business logic
├── <module>.repository.ts    # Data access (Prisma)
└── <module>.routes.ts        # Express routes
```

#### Imports

Order imports as follows:
1. External packages (Node.js built-ins, npm packages)
2. Internal config/database
3. Internal modules/services
4. Internal middleware/utils
5. Types

```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { sendSuccess } from '../../shared/utils/response.helper';
```

#### Controllers

- Use class-based controllers with instance methods
- Export singleton instance: `export const authController = new AuthController();`
- Validate inputs with Zod schemas (inline or defined at top of file)
- Wrap in try-catch and pass errors to `next(err)`
- Use `sendSuccess()` and `sendPaginated()` helpers for responses

```typescript
export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(email, password);
      sendSuccess(res, result, 'Login exitoso');
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
```

#### Services

- Use class-based services with singleton exports
- Contain all business logic
- Throw `AppError` for business rule violations
- Use Prisma for database operations (directly or via repository)

```typescript
export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError('Credenciales inválidas o cuenta inactiva.', 401);
    }
    // ... logic
    return { accessToken, user: { ... } };
  }
}

export const authService = new AuthService();
```

#### Error Handling

- Use `AppError` class for application errors: `throw new AppError(message, statusCode, errors?)`
- Let Zod errors propagate (caught by error middleware)
- Error middleware handles `AppError`, `ZodError`, and Prisma errors automatically

#### Types & Naming

- Use TypeScript interfaces and types from `@prisma/client`
- Use Spanish for domain-specific names: `EstadoReserva`, `TipoPago`, `nombreCompleto`
- Use PascalCase for classes, enums, types
- Use camelCase for variables, functions, parameters
- Use UPPER_CASE for constants

#### Database

- Use Prisma Client for all database operations
- Import via: `import { prisma } from '../../config/database';`
- Prefer repository pattern for complex queries
- Use transactions for multi-step operations: `await prisma.$transaction([...])`

### Frontend Conventions

#### File Structure

```
src/
├── pages/
│   ├── public/              # Public pages (home, catalog, etc.)
│   ├── admin/               # Admin pages
│   └── vendor/              # Vendor pages
├── components/
│   ├── layout/              # Layout components
│   ├── ui/                  # Reusable UI components
│   └── <feature>/           # Feature-specific components
├── services/                # API client (Axios)
├── store/                   # Zustand stores
├── types/                   # TypeScript interfaces
├── utils/                   # Utility functions
└── router/                  # React Router configuration
```

#### Imports

Order imports as follows:
1. React hooks
2. Third-party libraries
3. Local services/stores
4. Local components
5. Local utils/types
6. Styles (if any)

```typescript
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatPrice } from '../../utils/format';
import type { Product } from '../../types';
```

#### Components

- Use functional components with hooks
- Prefer named exports for page components
- Use default export for `export default` pattern
- Use TypeScript interfaces for props
- Destructure props in function signature

```typescript
interface SidebarProps {
  marcas: string[];
  selectedMarcas: string[];
  onToggleMarca: (m: string) => void;
}

const Sidebar = ({ marcas, selectedMarcas, onToggleMarca }: SidebarProps) => {
  // Component logic
};
```

#### State Management

- Use **Zustand** for global state (auth, cart)
- Use `useState` for local component state
- Use `useEffect` for side effects
- Persist auth state (user only, NOT tokens) using Zustand persist middleware

```typescript
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user, accessToken, refreshToken) => {
        setTokens(accessToken, refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'paguito-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

#### API Calls

- Use the configured `api` instance from `services/api.ts`
- Tokens are automatically attached via interceptor
- Handle errors in components with try-catch
- Use `toast.error()` for user-facing errors

```typescript
try {
  const { data } = await api.post('/reservations', reservationData);
  toast.success('Reserva creada exitosamente');
  navigate('/reserva-exitosa');
} catch (error: any) {
  toast.error(error.response?.data?.message || 'Error al crear reserva');
}
```

#### Styling

- Use **Tailwind CSS** utility classes
- Follow existing color scheme: primary blue `#0f49bd`, gray scale
- Use responsive classes: `md:`, `lg:`, etc.
- Prefer Tailwind over custom CSS

#### Types

- Define types in `src/types/index.ts` or component-specific files
- Use interfaces for object shapes
- Use type aliases for unions and complex types
- Import types with `type` keyword: `import type { Product } from '../../types';`

### Testing Conventions (Backend)

- Test files: `*.test.ts` or `*.spec.ts` in `src/__tests__/`
- Use Vitest with globals enabled
- Mock external dependencies at top of file with `vi.mock()`
- Mock logger to avoid console noise in tests
- Use descriptive test names in Spanish

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../shared/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('ReservationService', () => {
  it('debería crear una reserva y asignar vendedor', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## Security & Environment

- **NEVER commit secrets** to git (`.env` is gitignored)
- Use `npm run generate-secrets` to create secure JWT/Redis secrets
- Use `npm run env:validate` to verify environment setup
- Store tokens in memory (not localStorage) to prevent XSS attacks
- Frontend tokens are managed by `services/api.ts` and not persisted

---

## Common Patterns & Pitfalls

### Backend

- Always use `async/await` for Prisma operations
- Use Prisma transactions for operations that modify multiple tables
- Validate all inputs with Zod before processing
- Use `AppError` for expected errors (not generic `Error`)
- Use `logger` from `shared/utils/logger` for structured logging

### Frontend

- Always handle loading states (`isLoading`)
- Always handle error states with user-friendly messages
- Use React Router's `useNavigate()` for programmatic navigation
- Use `toast` from `react-hot-toast` for notifications
- Validate forms with `react-hook-form` + Zod resolver

### Database

- Run `npm run db:generate` after modifying `schema.prisma`
- Create migrations with `npm run db:migrate` (not `db:push` in production)
- Seed data is in `backend/prisma/seed.ts`
- Use indexes for frequently queried fields (already defined in schema)

---

## Architecture Notes

- **Modular structure:** Each business domain is isolated in `backend/src/modules/`
- **Shared utilities:** Common middleware, services, utils in `backend/src/shared/`
- **API prefix:** All API routes start with `/api`
- **Authentication:** JWT with access tokens (15 min) and refresh tokens (7 days)
- **Authorization:** Role-based with `authenticate` and `requireRole()` middleware
- **File uploads:** Multer for product images, stored in `backend/uploads/productos/`
- **Round Robin:** Vendor assignment algorithm in `shared/services/roundrobin.service.ts`

---

## Key Business Rules

1. **Reservations:** Customer identified by CURP, can only have one active reservation
2. **Vendor Assignment:** Automatic using Round Robin (least recently assigned vendor)
3. **Product Images:** Max 3 images per product, max 5 MB each (JPG, PNG, WebP)
4. **Business Hours:** Mon-Fri 9:30-16:30, Sat 9:30-14:30 (validated in backend)
5. **Reservation States:** NUEVA → ASIGNADA → EN_VISITA → VENDIDA/NO_CONCRETADA
6. **Stock Management:** Admin can mark products as inactive or out of stock

---

## Useful References

- **README.md:** Full project documentation, API endpoints, deployment guide
- **SEGURIDAD-SETUP.md:** Security and environment setup guide
- **backend/SECURITY.md:** Comprehensive security documentation
- **Prisma Schema:** `backend/prisma/schema.prisma` for database structure
- **API Client:** `frontend/src/services/api.ts` for interceptors and token management
