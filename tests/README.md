# Testing Documentation

This directory contains the comprehensive test suite for the Release Management Checklist App.

## Test Structure

```
tests/
├── README.md                 # This file
├── setup.ts                  # Global test setup and mocks
├── utils/
│   └── test-utils.tsx        # Common test utilities and helpers
├── components/               # Component tests
│   ├── ui/                   # UI component tests
│   ├── projects/             # Project-related component tests
│   ├── releases/             # Release-related component tests
│   ├── teams/                # Team-related component tests
│   ├── members/              # Member-related component tests
│   ├── targets/              # Target-related component tests
│   ├── users/                # User-related component tests
│   ├── auth/                 # Authentication component tests
│   ├── layout/               # Layout component tests
│   └── home/                 # Dashboard/home component tests
├── lib/                      # Utility and library function tests
├── api/                      # API route tests
└── app/                      # Page component tests
```

## Test Categories

### 1. Component Tests (`tests/components/`)
- **UI Components**: Basic UI components like Button, Card, Dialog, etc.
- **Feature Components**: Complex components that implement specific features
- **Layout Components**: Header, Sidebar, Footer, and layout-related components
- **Form Components**: Form handling and validation components

### 2. Library Tests (`tests/lib/`)
- **Utility Functions**: Helper functions and utilities
- **Repository Classes**: Data access layer tests
- **State Management**: Context and state management tests
- **Configuration**: App configuration and setup tests

### 3. API Tests (`tests/api/`)
- **Route Handlers**: Next.js API route tests
- **Request/Response**: HTTP request and response handling
- **Error Handling**: API error scenarios and edge cases
- **Authentication**: API authentication and authorization

### 4. App Tests (`tests/app/`)
- **Page Components**: Full page component tests
- **Routing**: Navigation and routing tests
- **Integration**: End-to-end page functionality

## Running Tests

### Available Commands

```bash
# Run tests in watch mode (development)
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Test Configuration

The test configuration is defined in `vitest.config.ts` and includes:

- **Environment**: jsdom for DOM testing
- **Setup**: Global test setup in `tests/setup.ts`
- **Aliases**: Path aliases for clean imports
- **CSS**: CSS processing for component styling

## Test Utilities

### Custom Render Function

The `test-utils.tsx` file provides a custom render function that includes:

- **Context Providers**: Auth and Sidebar context providers
- **Mock Data**: Common mock data for testing
- **Custom Matchers**: Helper functions for common assertions

### Mock Data

Common mock data is available in `test-utils.tsx`:

```typescript
import { mockUser, mockProject, mockTeam, mockRelease, mockFeature, mockMember, mockTarget } from '@/tests/utils/test-utils'
```

### Custom Assertions

Helper functions for common test assertions:

```typescript
import { 
  expectElementToBeInDocument,
  expectElementToHaveText,
  expectElementToHaveClass,
  expectElementToBeVisible,
  expectElementToBeDisabled,
  expectElementToBeEnabled
} from '@/tests/utils/test-utils'
```

## Testing Guidelines

### 1. Test Structure

Each test file should follow this structure:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from '@/components/path/to/ComponentName'

// Mock dependencies
vi.mock('@/lib/dependency', () => ({
  DependencyClass: vi.fn().mockImplementation(() => ({
    method: vi.fn(),
  })),
}))

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    // Test implementation
  })

  it('should handle user interactions', async () => {
    // Test implementation
  })

  it('should handle errors gracefully', () => {
    // Test implementation
  })
})
```

### 2. Test Naming

Use descriptive test names that explain the behavior:

```typescript
// Good
it('should display error message when form validation fails', () => {
  // Test implementation
})

// Bad
it('should work', () => {
  // Test implementation
})
```

### 3. Test Organization

Group related tests using `describe` blocks:

```typescript
describe('UserForm Component', () => {
  describe('rendering', () => {
    it('should render all form fields', () => {})
    it('should show validation errors', () => {})
  })

  describe('user interactions', () => {
    it('should submit form with valid data', () => {})
    it('should prevent submission with invalid data', () => {})
  })

  describe('error handling', () => {
    it('should handle network errors', () => {})
    it('should handle server errors', () => {})
  })
})
```

### 4. Mocking Guidelines

#### Mock External Dependencies

```typescript
// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
  })),
}))
```

#### Mock Components

```typescript
// Mock child components
vi.mock('@/components/ChildComponent', () => ({
  ChildComponent: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="child-component">
      {children}
    </button>
  ),
}))
```

#### Mock Browser APIs

```typescript
// Mock browser APIs
const mockConfirm = vi.fn()
const mockAlert = vi.fn()
Object.defineProperty(window, 'confirm', { value: mockConfirm })
Object.defineProperty(window, 'alert', { value: mockAlert })
```

### 5. Async Testing

Use proper async/await patterns:

```typescript
it('should handle async operations', async () => {
  const user = userEvent.setup()
  const mockFunction = vi.fn().mockResolvedValue('result')

  render(<Component onAction={mockFunction} />)
  
  const button = screen.getByRole('button')
  await user.click(button)

  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled()
  })
})
```

### 6. Error Testing

Test error scenarios and edge cases:

```typescript
it('should handle API errors gracefully', async () => {
  const mockError = new Error('API Error')
  vi.mocked(apiCall).mockRejectedValue(mockError)

  render(<Component />)

  await waitFor(() => {
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })
})
```

## Coverage Goals

### Component Coverage
- **UI Components**: 100% coverage
- **Feature Components**: 95% coverage
- **Layout Components**: 90% coverage

### Library Coverage
- **Utility Functions**: 100% coverage
- **Repository Classes**: 95% coverage
- **State Management**: 90% coverage

### API Coverage
- **Route Handlers**: 95% coverage
- **Error Handling**: 100% coverage
- **Authentication**: 100% coverage

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Avoid shared state between tests

### 2. Realistic Testing
- Test real user interactions
- Use realistic data
- Test actual component behavior

### 3. Accessibility Testing
- Test keyboard navigation
- Test screen reader compatibility
- Verify ARIA attributes

### 4. Performance Testing
- Test component rendering performance
- Test memory leaks
- Test large dataset handling

### 5. Security Testing
- Test input validation
- Test authentication requirements
- Test authorization checks

## Debugging Tests

### Common Issues

1. **Mock Not Working**: Ensure mocks are defined before imports
2. **Async Issues**: Use `waitFor` for async operations
3. **Component Not Rendering**: Check for missing providers or context
4. **Type Errors**: Ensure proper TypeScript types for mocks

### Debug Commands

```bash
# Run specific test file
npm test -- tests/components/Button.test.tsx

# Run tests with verbose output
npm test -- --verbose

# Run tests in debug mode
npm test -- --debug
```

## Continuous Integration

Tests are automatically run in CI/CD pipeline:

- **Pre-commit**: Run tests before committing
- **Pull Request**: Run full test suite
- **Deployment**: Run tests before deployment

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use the provided test utilities
3. Ensure proper coverage
4. Update this documentation if needed
5. Run the full test suite before submitting

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event](https://testing-library.com/docs/user-event/intro/) 