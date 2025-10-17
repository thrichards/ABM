# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 + Supabase starter template with TypeScript, Tailwind CSS, and shadcn/ui components. It implements cookie-based authentication with Supabase SSR across the entire Next.js stack.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Setup

Required environment variables (copy `.env.example` to `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=[Your Supabase Project URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[Your Supabase Anon/Publishable Key]
```

## Architecture

### Authentication Flow
- **Middleware** (`middleware.ts`): Intercepts all requests to manage session cookies
- **Server Client** (`lib/supabase/server.ts`): For Server Components and Server Actions
- **Browser Client** (`lib/supabase/client.ts`): For Client Components
- **Middleware Helper** (`lib/supabase/middleware.ts`): Session refresh logic

All auth routes are in `/app/auth/` with forms as client components and route handlers for OAuth callbacks.

### Protected Routes
Routes under `/app/protected/` require authentication. The middleware automatically redirects unauthenticated users to `/auth/login`.

### Component Architecture
- **Server Components**: Default for all pages and layouts
- **Client Components**: Auth forms, interactive UI (marked with `"use client"`)
- **UI Components**: Pre-built shadcn/ui components in `/components/ui/`
- **Tutorial Components**: Onboarding guides in `/components/tutorial/`

## Key Implementation Patterns

### Creating New Protected Routes
Place new protected pages under `/app/protected/` or add authentication checks using:
```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth/login");
```

### Adding UI Components
Use shadcn/ui CLI to add new components:
```bash
npx shadcn@latest add [component-name]
```

### Styling Conventions
- Use Tailwind CSS utility classes
- Theme colors via CSS variables (HSL format)
- Dark mode support via `next-themes` and `.dark` class
- Combine classes with `cn()` utility from `lib/utils.ts`

### Form Handling
Auth forms use Server Actions pattern:
```typescript
// In form component (client)
<form action={signIn}>

// Server action
async function signIn(formData: FormData) {
  "use server";
  const supabase = await createClient();
  // Handle auth
}
```

## Project Structure

```
/app                  # Next.js App Router
  /auth              # Authentication pages
  /protected         # Authenticated-only routes
  layout.tsx         # Root layout with providers
  page.tsx           # Landing page
/components
  /ui                # shadcn/ui components
  /tutorial          # Onboarding components
  *-form.tsx         # Client-side form components
/lib
  /supabase          # Supabase client configurations
  utils.ts           # Utility functions
middleware.ts        # Session management middleware
```

## Testing

No testing framework is currently configured. Consider adding:
- Vitest or Jest for unit tests
- Playwright or Cypress for E2E tests
- React Testing Library for component tests

## Deployment

Optimized for Vercel deployment with automatic environment variable assignment via Supabase Vercel Integration. The production build uses Next.js optimizations including:
- Automatic code splitting
- Image optimization
- Font optimization (Geist font)
- Server Components for reduced client bundle