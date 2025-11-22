# Testing Setup

This project uses Vitest for testing React components and utilities.

## Setup

Install dependencies:
```bash
npm install
# or if you have permission issues:
yarn install
```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

## Test Files

- `src/components/ProtectedRoute.test.tsx` - Tests for protected route component
- `src/routes/index.test.tsx` - Tests for routing configuration
- `src/services/apiClient.test.ts` - Tests for API client utilities

## Test Coverage

Current tests cover:
- ProtectedRoute component behavior (auth required/not required, loading states)
- Route rendering for all main routes
- Route parameter handling (project IDs)
- Unknown route redirects

## Adding New Tests

When adding new components or features, add corresponding test files:
- Component tests: `ComponentName.test.tsx`
- Utility tests: `utilityName.test.ts`
- Hook tests: `useHookName.test.ts`

