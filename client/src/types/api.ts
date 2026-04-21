export type Role = 'ADMIN' | 'ANALYST';
export type CardType = 'AMEX' | 'VISA' | 'MASTERCARD' | 'DISCOVER';
export type TxnStatus = 'ACCEPTED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Card {
  id: string;
  maskedNumber: string;
  last4: string;
  cardType: CardType;
  holderName: string | null;
  createdAt: string;
  updatedAt: string;
  transactionCount?: number;
}

export interface Paginated<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface Transaction {
  id: string;
  maskedNumber: string;
  timestamp: string;
  amount: string;
  status: TxnStatus;
  rejectionReason: string | null;
  batchId: string | null;
  card: {
    id: string;
    last4: string;
    cardType: CardType;
    holderName: string | null;
  } | null;
}

export interface RejectedTransaction {
  id: string;
  maskedNumber: string;
  timestamp: string;
  amount: string;
  rejectionReason: string | null;
  batchId: string | null;
  createdAt: string;
}

export interface Summary {
  cards: number;
  transactions: number;
  accepted: number;
  rejected: number;
  batches: number;
  totalVolume: string;
}

export interface ByCardRow {
  cardId: string | null;
  maskedNumber: string | null;
  last4: string | null;
  cardType: CardType | null;
  holderName: string | null;
  count: number;
  total: string;
}

export interface ByCardTypeRow {
  cardType: CardType;
  count: number;
  total: string;
}

export interface RejectedReasonRow {
  reason: string;
  count: number;
}

export interface ByDayRow {
  date: string;
  count: number;
  total: string;
}

export interface IngestionBatch {
  id: string;
  filename: string;
  format: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  uploadedById: string;
  createdAt: string;
}
