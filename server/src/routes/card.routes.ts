import { Router } from 'express';
import * as controller from '../controllers/card.controller';
import { requireAuth, requireRole } from '../middleware/auth';

export const cardRouter = Router();

cardRouter.use(requireAuth);
cardRouter.get('/', controller.getCards);
cardRouter.get('/:id', controller.getCardById);
cardRouter.post('/', requireRole('ADMIN'), controller.postCard);
cardRouter.put('/:id', requireRole('ADMIN'), controller.putCard);
cardRouter.delete('/:id', requireRole('ADMIN'), controller.deleteCard);
