import { NextFunction, Request, Response } from 'express';
import { createCardSchema, listCardsQuerySchema, updateCardSchema } from '../validators/card';
import * as cardService from '../services/card.service';

export async function getCards(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listCardsQuerySchema.parse(req.query);
    const result = await cardService.listCards(query);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function getCardById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await cardService.getCard(req.params.id);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function postCard(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCardSchema.parse(req.body);
    const result = await cardService.createCard(input);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function putCard(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateCardSchema.parse(req.body);
    const result = await cardService.updateCard(req.params.id, input);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function deleteCard(req: Request, res: Response, next: NextFunction) {
  try {
    await cardService.deleteCard(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
