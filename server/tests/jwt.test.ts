import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../src/lib/jwt';

describe('jwt helpers', () => {
  it('signs and verifies a round-trip payload', () => {
    const token = signToken({ sub: 'u1', email: 'a@b', role: 'ADMIN' });
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject({ sub: 'u1', email: 'a@b', role: 'ADMIN' });
  });

  it('throws on a tampered token', () => {
    const token = signToken({ sub: 'u1', email: 'a@b', role: 'ANALYST' });
    const bad = token.slice(0, -2) + 'xx';
    expect(() => verifyToken(bad)).toThrow();
  });
});
