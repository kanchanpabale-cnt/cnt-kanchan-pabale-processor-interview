import { NextFunction, Request, Response } from 'express';
import { loginSchema } from '../validators/auth';
import * as authService from '../services/auth.service';

export async function postLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.getMe(req.user!.sub);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function postLogout(_req: Request, res: Response) {
  // Stateless JWT — client drops the token. Returned for symmetry.
  return res.json({ ok: true });
}
