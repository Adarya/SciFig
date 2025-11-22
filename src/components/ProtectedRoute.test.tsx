import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock the auth provider hook
const mockUseAuth = vi.fn();

vi.mock('../providers/ApiAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
  ApiAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const TestComponent = () => <div>Protected Content</div>;

  const renderWithRouter = (requireAuth = true) => {
    return render(
      <BrowserRouter>
        <ProtectedRoute requireAuth={requireAuth}>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );
  };

  it('renders children when user is authenticated and auth is required', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false,
    });

    renderWithRouter(true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    renderWithRouter(true);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when auth is not required', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    renderWithRouter(false);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

