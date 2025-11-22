import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './index';

// Mock components to avoid full rendering
vi.mock('../components/LandingPage', () => ({
  default: () => <div>Landing Page</div>,
}));

vi.mock('../components/Dashboard', () => ({
  default: () => <div>Dashboard</div>,
}));

vi.mock('../components/AnalysisWorkflow', () => ({
  default: () => <div>Analysis Workflow</div>,
}));

vi.mock('../components/FigureAnalyzer', () => ({
  default: () => <div>Figure Analyzer</div>,
}));

vi.mock('../components/PricingPage', () => ({
  default: () => <div>Pricing Page</div>,
}));

vi.mock('../components/AdminPage', () => ({
  default: () => <div>Admin Page</div>,
}));

vi.mock('../components/KaplanMeierAnalysis', () => ({
  default: () => <div>Kaplan-Meier Analysis</div>,
}));

vi.mock('../components/AuthModal', () => ({
  default: () => null,
}));

// Mock auth provider
const mockUseAuth = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../providers/ApiAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
  ApiAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut,
    });
  });

  it('renders landing page at root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
  });

  it('renders pricing page at /pricing', () => {
    render(
      <MemoryRouter initialEntries={['/pricing']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('Pricing Page')).toBeInTheDocument();
  });

  it('renders analysis workflow at /analysis', () => {
    render(
      <MemoryRouter initialEntries={['/analysis']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('Analysis Workflow')).toBeInTheDocument();
  });

  it('renders analysis workflow with project ID at /analysis/:projectId', () => {
    render(
      <MemoryRouter initialEntries={['/analysis/test-project-id']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('Analysis Workflow')).toBeInTheDocument();
  });

  it('renders figure analyzer at /figure-analyzer', () => {
    render(
      <MemoryRouter initialEntries={['/figure-analyzer']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('Figure Analyzer')).toBeInTheDocument();
  });

  it('renders kaplan-meier page at /kaplan-meier', () => {
    render(
      <MemoryRouter initialEntries={['/kaplan-meier']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('Kaplan-Meier Analysis')).toBeInTheDocument();
  });

  it('redirects unknown routes to landing page', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
  });
});

