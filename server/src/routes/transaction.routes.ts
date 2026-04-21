import { Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/transaction.controller';
import { requireAuth } from '../middleware/auth';

export const transactionRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB — covers the full data/*.xml
});

transactionRouter.use(requireAuth);
transactionRouter.get('/', controller.getTransactions);
transactionRouter.post('/upload', upload.single('file'), controller.postUpload);
