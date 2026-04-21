import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from '../guards';
import { useAuthStore } from '../../store/auth.store';

describe('RequireAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('redirects to /login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>Secret</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({
      token: 't',
      user: { id: '1', email: 'a@b', name: 'A', role: 'ADMIN' },
    });
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>Secret</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });
});

describe('RequireRole', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('redirects to /login when there is no user', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/admin"
            element={
              <RequireRole role="ADMIN">
                <div>Admin zone</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects home when user has the wrong role', () => {
    useAuthStore.setState({
      token: 't',
      user: { id: '1', email: 'a@b', name: 'A', role: 'ANALYST' },
    });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route
            path="/admin"
            element={
              <RequireRole role="ADMIN">
                <div>Admin zone</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders children when role matches', () => {
    useAuthStore.setState({
      token: 't',
      user: { id: '1', email: 'a@b', name: 'A', role: 'ADMIN' },
    });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <RequireRole role="ADMIN">
                <div>Admin zone</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Admin zone')).toBeInTheDocument();
  });
});
