import { NextFunction, Request, Response } from 'express';
import { listTransactionsQuerySchema } from '../validators/transaction';
import * as txService from '../services/transaction.service';
import { ingestUpload } from '../services/ingestion';

export async function getTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listTransactionsQuerySchema.parse(req.query);
    const result = await txService.listTransactions(query);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function postUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ingestUpload(req.file, req.user!.sub);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}
