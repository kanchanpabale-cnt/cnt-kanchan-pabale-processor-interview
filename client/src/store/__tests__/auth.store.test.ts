import { useAuthStore } from '../auth.store';
import type { User } from '../../types/api';

const USER: User = {
  id: '1',
  email: 'admin@signapay.local',
  name: 'Admin',
  role: 'ADMIN',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('initializes empty', () => {
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setSession stores token + user', () => {
    useAuthStore.getState().setSession('tok-abc', USER);
    expect(useAuthStore.getState().token).toBe('tok-abc');
    expect(useAuthStore.getState().user).toEqual(USER);
  });

  it('logout clears token + user', () => {
    useAuthStore.getState().setSession('tok-abc', USER);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
