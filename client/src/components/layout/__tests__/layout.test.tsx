import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { TopBar } from '../TopBar';
import { useAuthStore } from '../../../store/auth.store';

describe('Sidebar', () => {
  it('renders brand + nav items', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(screen.getByRole('img', { name: 'SignaPay' })).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Cards.*Transactions/)).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});

describe('TopBar', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('renders nothing auth-related when no user', () => {
    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: /open settings/i })).not.toBeInTheDocument();
  });

  it('renders settings link with email when admin is signed in', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: '1', email: 'admin@x.com', name: 'Admin', role: 'ADMIN' },
    });
    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /open settings/i })).toBeInTheDocument();
    expect(screen.getByText('admin@x.com')).toBeInTheDocument();
  });

  it('renders analyst user', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { id: '2', email: 'a@x.com', name: 'A', role: 'ANALYST' },
    });
    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>,
    );
    expect(screen.getByText('a@x.com')).toBeInTheDocument();
  });
});
