import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { HttpError } from '../middleware/error';
import type { LoginInput } from '../validators/auth';

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new HttpError(401, 'Invalid credentials', 'Unauthorized');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials', 'Unauthorized');

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) throw new HttpError(404, 'User not found', 'NotFound');
  return user;
}
