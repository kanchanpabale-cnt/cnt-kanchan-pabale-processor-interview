import { api } from '../../lib/axios';
import * as authActions from '../auth.actions';
import * as cardActions from '../card.actions';
import * as txActions from '../transaction.actions';
import * as reportActions from '../report.actions';

jest.mock('../../lib/axios', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.put.mockReset();
  apiMock.delete.mockReset();
});

describe('auth.actions', () => {
  it('login posts credentials and returns the data', async () => {
    apiMock.post.mockResolvedValue({ data: { token: 't', user: { id: '1' } } });
    const r = await authActions.login('a@b.com', 'pw');
    expect(apiMock.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw' });
    expect(r).toEqual({ token: 't', user: { id: '1' } });
  });

  it('fetchMe gets /auth/me', async () => {
    apiMock.get.mockResolvedValue({ data: { id: '1' } });
    const r = await authActions.fetchMe();
    expect(apiMock.get).toHaveBeenCalledWith('/auth/me');
    expect(r).toEqual({ id: '1' });
  });
});

describe('card.actions', () => {
  it('listCards forwards params', async () => {
    apiMock.get.mockResolvedValue({ data: { total: 0, page: 1, pageSize: 20, items: [] } });
    await cardActions.listCards({ page: 2, pageSize: 10, cardType: 'VISA', q: 'test' });
    expect(apiMock.get).toHaveBeenCalledWith('/cards', {
      params: { page: 2, pageSize: 10, cardType: 'VISA', q: 'test' },
    });
  });

  it('listCards defaults to an empty query', async () => {
    apiMock.get.mockResolvedValue({ data: { total: 0, page: 1, pageSize: 20, items: [] } });
    await cardActions.listCards();
    expect(apiMock.get).toHaveBeenCalledWith('/cards', { params: {} });
  });

  it('getCard hits /cards/:id', async () => {
    apiMock.get.mockResolvedValue({ data: { id: 'c1' } });
    const r = await cardActions.getCard('c1');
    expect(apiMock.get).toHaveBeenCalledWith('/cards/c1');
    expect(r).toEqual({ id: 'c1' });
  });

  it('createCard posts body', async () => {
    apiMock.post.mockResolvedValue({ data: { id: 'c1' } });
    const body = {
      cardNumber: '4111111111111111',
      holderName: 'Jane',
      transactions: [{ amount: '10', timestamp: '2025-01-01T00:00:00Z' }],
    };
    await cardActions.createCard(body);
    expect(apiMock.post).toHaveBeenCalledWith('/cards', body);
  });

  it('updateCard puts body', async () => {
    apiMock.put.mockResolvedValue({ data: { id: 'c1' } });
    await cardActions.updateCard('c1', { holderName: 'X' });
    expect(apiMock.put).toHaveBeenCalledWith('/cards/c1', { holderName: 'X' });
  });

  it('deleteCard deletes by id', async () => {
    apiMock.delete.mockResolvedValue({ data: null });
    await cardActions.deleteCard('c1');
    expect(apiMock.delete).toHaveBeenCalledWith('/cards/c1');
  });
});

describe('transaction.actions', () => {
  it('listTransactions forwards params', async () => {
    apiMock.get.mockResolvedValue({ data: { total: 0, page: 1, pageSize: 25, items: [] } });
    await txActions.listTransactions({ status: 'ACCEPTED', cardId: 'c1' });
    expect(apiMock.get).toHaveBeenCalledWith('/transactions', {
      params: { status: 'ACCEPTED', cardId: 'c1' },
    });
  });

  it('listTransactions defaults to empty params', async () => {
    apiMock.get.mockResolvedValue({ data: { total: 0, page: 1, pageSize: 25, items: [] } });
    await txActions.listTransactions();
    expect(apiMock.get).toHaveBeenCalledWith('/transactions', { params: {} });
  });

  it('uploadTransactions sends multipart form data', async () => {
    apiMock.post.mockResolvedValue({ data: { id: 'b1' } });
    const file = new File(['hi'], 't.csv', { type: 'text/csv' });
    await txActions.uploadTransactions(file);
    expect(apiMock.post).toHaveBeenCalledWith(
      '/transactions/upload',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  });
});

describe('report.actions', () => {
  it('fetchSummary', async () => {
    apiMock.get.mockResolvedValue({ data: {} });
    await reportActions.fetchSummary();
    expect(apiMock.get).toHaveBeenCalledWith('/reports/summary');
  });

  it('fetchByCard', async () => {
    apiMock.get.mockResolvedValue({ data: [] });
    await reportActions.fetchByCard();
    expect(apiMock.get).toHaveBeenCalledWith('/reports/by-card');
  });

  it('fetchByCardType', async () => {
    apiMock.get.mockResolvedValue({ data: [] });
    await reportActions.fetchByCardType();
    expect(apiMock.get).toHaveBeenCalledWith('/reports/by-card-type');
  });

  it('fetchByDay', async () => {
    apiMock.get.mockResolvedValue({ data: [] });
    await reportActions.fetchByDay();
    expect(apiMock.get).toHaveBeenCalledWith('/reports/by-day');
  });

  it('fetchRejected passes pagination', async () => {
    apiMock.get.mockResolvedValue({ data: { total: 0, page: 1, pageSize: 25, items: [] } });
    await reportActions.fetchRejected(2, 50);
    expect(apiMock.get).toHaveBeenCalledWith('/reports/rejected', {
      params: { page: 2, pageSize: 50 },
    });
  });

  it('fetchRejected defaults to page 1, pageSize 25', async () => {
    apiMock.get.mockResolvedValue({ data: { total: 0, page: 1, pageSize: 25, items: [] } });
    await reportActions.fetchRejected();
    expect(apiMock.get).toHaveBeenCalledWith('/reports/rejected', {
      params: { page: 1, pageSize: 25 },
    });
  });

  it('fetchRejectedByReason', async () => {
    apiMock.get.mockResolvedValue({ data: [] });
    await reportActions.fetchRejectedByReason();
    expect(apiMock.get).toHaveBeenCalledWith('/reports/rejected-by-reason');
  });
});
