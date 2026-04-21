import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../src/lib/prisma';
import * as authService from '../src/services/auth.service';
import { HttpError } from '../src/middleware/error';

const prismaMock = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  prismaMock.user.findUnique.mockReset();
});

describe('authService.login', () => {
  it('rejects when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(authService.login({ email: 'a@b', password: 'pw' })).rejects.toBeInstanceOf(
      HttpError,
    );
    await expect(
      authService.login({ email: 'a@b', password: 'pw' }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('rejects wrong password', async () => {
    const hash = await bcrypt.hash('correct', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'a@b',
      name: 'A',
      role: 'ADMIN',
      passwordHash: hash,
    });
    await expect(
      authService.login({ email: 'a@b', password: 'wrong' }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('returns token + user when password matches', async () => {
    const hash = await bcrypt.hash('pw', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'a@b',
      name: 'A',
      role: 'ADMIN',
      passwordHash: hash,
    });
    const r = await authService.login({ email: 'a@b', password: 'pw' });
    expect(r.token).toBeTruthy();
    expect(r.user.passwordHash).toBeUndefined();
    expect(r.user.role).toBe('ADMIN');
  });
});

describe('authService.getMe', () => {
  it('404s when user is missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(authService.getMe('x')).rejects.toMatchObject({ status: 404 });
  });

  it('returns the user profile when present', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'a@b',
      name: 'A',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    const r = await authService.getMe('1');
    expect(r.email).toBe('a@b');
  });
});
