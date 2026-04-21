import {
  AMOUNT_MAX,
  amountSchema,
  cardFormSchema,
  cardNumberSchema,
  cardUpdateFormSchema,
  loginFormSchema,
  timestampSchema,
} from '../validators';

describe('loginFormSchema', () => {
  it('accepts a valid login', () => {
    expect(loginFormSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
  it('rejects bad email', () => {
    const r = loginFormSchema.safeParse({ email: 'nope', password: 'x' });
    expect(r.success).toBe(false);
  });
  it('rejects empty password', () => {
    const r = loginFormSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('cardNumberSchema', () => {
  it('strips spaces then validates', () => {
    const r = cardNumberSchema.safeParse('4111 1111 1111 1111');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('4111111111111111');
  });
  it('accepts 16-digit Visa/MC/Discover', () => {
    expect(cardNumberSchema.safeParse('4111111111111111').success).toBe(true);
    expect(cardNumberSchema.safeParse('5555555555554444').success).toBe(true);
    expect(cardNumberSchema.safeParse('6011000990139424').success).toBe(true);
  });
  it('accepts 15-digit Amex', () => {
    expect(cardNumberSchema.safeParse('371449635398431').success).toBe(true);
  });
  it('rejects 16-digit starting with 3', () => {
    const r = cardNumberSchema.safeParse('3111111111111111');
    expect(r.success).toBe(false);
  });
  it('rejects 15-digit starting with 4', () => {
    const r = cardNumberSchema.safeParse('411111111111111');
    expect(r.success).toBe(false);
  });
  it('rejects wrong length', () => {
    expect(cardNumberSchema.safeParse('41111').success).toBe(false);
    expect(cardNumberSchema.safeParse('41111111111111112222').success).toBe(false);
  });
  it('rejects non-digit characters after stripping spaces', () => {
    const r = cardNumberSchema.safeParse('4111-1111-1111-1111');
    expect(r.success).toBe(false);
  });
  it('rejects leading digits outside {3,4,5,6}', () => {
    expect(cardNumberSchema.safeParse('1111111111111111').success).toBe(false);
    expect(cardNumberSchema.safeParse('9111111111111111').success).toBe(false);
    expect(cardNumberSchema.safeParse('711111111111111').success).toBe(false);
  });
});

describe('amountSchema', () => {
  it('accepts valid positive amount', () => {
    expect(amountSchema.safeParse('100').success).toBe(true);
    expect(amountSchema.safeParse('0.01').success).toBe(true);
    expect(amountSchema.safeParse('99999.99').success).toBe(true);
  });
  it('accepts negative amount', () => {
    expect(amountSchema.safeParse('-50.00').success).toBe(true);
  });
  it('rejects zero', () => {
    expect(amountSchema.safeParse('0').success).toBe(false);
    expect(amountSchema.safeParse('0.00').success).toBe(false);
  });
  it('rejects amounts at or above the max', () => {
    expect(amountSchema.safeParse(String(AMOUNT_MAX)).success).toBe(false);
    expect(amountSchema.safeParse(String(AMOUNT_MAX + 1)).success).toBe(false);
  });
  it('rejects > 2 decimals', () => {
    expect(amountSchema.safeParse('1.123').success).toBe(false);
  });
  it('rejects non-numeric', () => {
    expect(amountSchema.safeParse('abc').success).toBe(false);
    expect(amountSchema.safeParse('').success).toBe(false);
  });
});

describe('timestampSchema', () => {
  it('accepts ISO strings', () => {
    expect(timestampSchema.safeParse('2025-03-14T12:00:00Z').success).toBe(true);
    expect(timestampSchema.safeParse('2025-03-14T12:00').success).toBe(true);
  });
  it('rejects empty', () => {
    expect(timestampSchema.safeParse('').success).toBe(false);
  });
  it('rejects unparseable', () => {
    expect(timestampSchema.safeParse('not-a-date').success).toBe(false);
  });
});

describe('cardFormSchema', () => {
  const good = {
    cardNumber: '4111111111111111',
    holderName: '',
    transactions: [{ amount: '123.45', timestamp: '2025-01-01T00:00:00Z' }],
  };
  it('accepts a valid payload', () => {
    expect(cardFormSchema.safeParse(good).success).toBe(true);
  });
  it('requires at least one transaction', () => {
    const r = cardFormSchema.safeParse({ ...good, transactions: [] });
    expect(r.success).toBe(false);
  });
  it('caps transactions at 50', () => {
    const many = Array.from({ length: 51 }, () => good.transactions[0]);
    const r = cardFormSchema.safeParse({ ...good, transactions: many });
    expect(r.success).toBe(false);
  });
});

describe('cardUpdateFormSchema', () => {
  it('accepts holder-only update', () => {
    const r = cardUpdateFormSchema.safeParse({ holderName: 'Jane' });
    expect(r.success).toBe(true);
  });
  it('accepts empty payload', () => {
    const r = cardUpdateFormSchema.safeParse({});
    expect(r.success).toBe(true);
  });
  it('accepts holder + amount + timestamp together', () => {
    const r = cardUpdateFormSchema.safeParse({
      holderName: 'Jane',
      amount: '50',
      timestamp: '2025-01-01T00:00:00Z',
    });
    expect(r.success).toBe(true);
  });
  it('rejects amount without timestamp', () => {
    const r = cardUpdateFormSchema.safeParse({ amount: '50' });
    expect(r.success).toBe(false);
  });
  it('rejects timestamp without amount', () => {
    const r = cardUpdateFormSchema.safeParse({ timestamp: '2025-01-01T00:00:00Z' });
    expect(r.success).toBe(false);
  });
  it('surfaces amount validation errors when both provided', () => {
    const r = cardUpdateFormSchema.safeParse({
      amount: '0',
      timestamp: '2025-01-01T00:00:00Z',
    });
    expect(r.success).toBe(false);
  });
  it('surfaces timestamp validation errors when both provided', () => {
    const r = cardUpdateFormSchema.safeParse({ amount: '50', timestamp: 'nope' });
    expect(r.success).toBe(false);
  });
});
