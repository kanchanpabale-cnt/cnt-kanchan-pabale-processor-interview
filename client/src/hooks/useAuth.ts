import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const { token, user, setSession, logout } = useAuthStore();
  return {
    token,
    user,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN',
    setSession,
    logout,
  };
}
