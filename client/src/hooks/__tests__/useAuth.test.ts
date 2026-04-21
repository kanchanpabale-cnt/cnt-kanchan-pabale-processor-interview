import { act, renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../../store/auth.store';
import type { User } from '../../types/api';

const ADMIN: User = { id: '1', email: 'a@x.com', name: 'A', role: 'ADMIN' };
const ANALYST: User = { id: '2', email: 'b@x.com', name: 'B', role: 'ANALYST' };

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('reports unauthenticated when no token or user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it('reports authenticated when token and user are set', () => {
    const { result } = renderHook(() => useAuth());
    act(() => result.current.setSession('tok', ADMIN));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it('reports not admin for analyst', () => {
    const { result } = renderHook(() => useAuth());
    act(() => result.current.setSession('tok', ANALYST));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('logout clears the session', () => {
    const { result } = renderHook(() => useAuth());
    act(() => result.current.setSession('tok', ADMIN));
    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
