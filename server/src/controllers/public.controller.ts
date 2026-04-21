import { NextFunction, Request, Response } from 'express';
import * as publicService from '../services/public.service';

export async function getShowcaseStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json(await publicService.showcaseStats());
  } catch (err) {
    next(err);
  }
}
