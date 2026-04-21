import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/login', loginLimiter, controller.postLogin);
authRouter.get('/me', requireAuth, controller.getMe);
authRouter.post('/logout', requireAuth, controller.postLogout);
