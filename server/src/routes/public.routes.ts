import { Router } from 'express';
import * as controller from '../controllers/public.controller';

export const publicRouter = Router();

// Unauthenticated — surfaces coarse aggregate stats for the login showcase only.
publicRouter.get('/showcase-stats', controller.getShowcaseStats);
