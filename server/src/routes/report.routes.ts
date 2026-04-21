import { Router } from 'express';
import * as controller from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth';

export const reportRouter = Router();

reportRouter.use(requireAuth);
reportRouter.get('/summary', controller.getSummary);
reportRouter.get('/by-card', controller.getByCard);
reportRouter.get('/by-card-type', controller.getByCardType);
reportRouter.get('/by-day', controller.getByDay);
reportRouter.get('/rejected', controller.getRejected);
reportRouter.get('/rejected-by-reason', controller.getRejectedByReason);
