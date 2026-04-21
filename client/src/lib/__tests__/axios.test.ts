import { api } from '../axios';
import { useAuthStore } from '../../store/auth.store';

describe('axios instance', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: { pathname: string; href: string } }).location = {
      pathname: '/',
      href: '/',
    };
  });

  it('has a baseURL set from the injected global', () => {
    expect(api.defaults.baseURL).toBe('/api');
  });

  describe('request interceptor', () => {
    it('adds an Authorization header when a token is present', async () => {
      useAuthStore.setState({
        token: 'tok-123',
        user: { id: '1', email: 'a@b.com', name: 'X', role: 'ADMIN' },
      });
      const handler = api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (c: { headers: Record<string, unknown> }) => unknown }>;
      };
      const config = { headers: {} as Record<string, unknown> };
      const result = (await handler.handlers[0].fulfilled(config)) as { headers: Record<string, string> };
      expect(result.headers.Authorization).toBe('Bearer tok-123');
    });

    it('leaves Authorization untouched when there is no token', async () => {
      const handler = api.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (c: { headers: Record<string, unknown> }) => unknown }>;
      };
      const config = { headers: {} as Record<string, unknown> };
      const result = (await handler.handlers[0].fulfilled(config)) as { headers: Record<string, string> };
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    const getRejected = () => {
      const handler = api.interceptors.response as unknown as {
        handlers: Array<{
          fulfilled: (r: unknown) => unknown;
          rejected: (e: unknown) => Promise<unknown>;
        }>;
      };
      return handler.handlers[0].rejected;
    };

    it('passes through non-401 errors unchanged', async () => {
      const err = { response: { status: 500 } };
      await expect(getRejected()(err)).rejects.toBe(err);
    });

    it('logs out and redirects to /login on 401 from a non-login page', async () => {
      useAuthStore.setState({
        token: 'tok',
        user: { id: '1', email: 'a@b.com', name: 'X', role: 'ADMIN' },
      });
      const err = { response: { status: 401 } };
      await expect(getRejected()(err)).rejects.toBe(err);
      expect(useAuthStore.getState().token).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('does not redirect if already on /login', async () => {
      (window as unknown as { location: { pathname: string; href: string } }).location.pathname = '/login';
      (window as unknown as { location: { pathname: string; href: string } }).location.href = '/login';
      useAuthStore.setState({
        token: 'tok',
        user: { id: '1', email: 'a@b.com', name: 'X', role: 'ADMIN' },
      });
      const err = { response: { status: 401 } };
      await expect(getRejected()(err)).rejects.toBe(err);
      expect(useAuthStore.getState().token).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('does not touch state when response has no status field', async () => {
      const err = {};
      await expect(getRejected()(err)).rejects.toBe(err);
    });
  });
});
