import { NextFunction, Request, Response } from 'express';
import { rejectedListQuerySchema } from '../validators/report';
import * as reports from '../services/report.service';

export async function getSummary(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json(await reports.summary());
  } catch (err) {
    return next(err);
  }
}

export async function getByCard(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json(await reports.byCard());
  } catch (err) {
    return next(err);
  }
}

export async function getByCardType(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json(await reports.byCardType());
  } catch (err) {
    return next(err);
  }
}

export async function getByDay(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.json(await reports.byDay());
  } catch (err) {
    return next(err);
  }
}

export async function getRejectedByReason(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    return res.json(await reports.rejectedByReason());
  } catch (err) {
    return next(err);
  }
}

export async function getRejected(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize } = rejectedListQuerySchema.parse(req.query);
    return res.json(await reports.rejected(page, pageSize));
  } catch (err) {
    return next(err);
  }
}
