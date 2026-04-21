import { Plus, Trash2 } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Button } from "../../design-system/Button";
import { Input } from "../../design-system/Input";
import {
  AMOUNT_MAX,
  cardFormSchema,
  cardUpdateFormSchema,
} from "../../lib/validators";
import { expectedLength, formatPan, stripNonDigits } from "../../lib/pan";
import type { Card, CardType } from "../../types/api";
import { CardBrandIcon } from "./CardBrandIcon";

type Mode = "create" | "edit";

export interface TxnEntry {
  amount: string;
  timestamp: string;
}

export interface CardFormSubmitValues {
  cardNumber?: string;
  holderName?: string;
  transactions?: TxnEntry[];
  amount?: string;
  timestamp?: string;
}

interface Props {
  mode: Mode;
  initial?: Partial<Card>;
  submitting?: boolean;
  onSubmit: (values: CardFormSubmitValues) => void;
  onCancel?: () => void;
}

function nowForDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function detectBrand(digits: string): CardType | null {
  if (!digits) return null;
  switch (digits[0]) {
    case "3":
      return "AMEX";
    case "4":
      return "VISA";
    case "5":
      return "MASTERCARD";
    case "6":
      return "DISCOVER";
    default:
      return null;
  }
}

const AMOUNT_INPUT_REGEX = /^-?\d*(\.\d{0,2})?$/;

export function CardForm({
  mode,
  initial,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const [cardDigits, setCardDigits] = useState("");
  const [holderName, setHolderName] = useState(initial?.holderName ?? "");
  const [transactions, setTransactions] = useState<TxnEntry[]>([
    { amount: "", timestamp: nowForDatetimeLocal() },
  ]);
  const [editAmount, setEditAmount] = useState("");
  const [editTimestamp, setEditTimestamp] = useState(nowForDatetimeLocal());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expected = expectedLength(cardDigits);
  const brand = detectBrand(cardDigits);
  const formatted = useMemo(() => formatPan(cardDigits), [cardDigits]);

  const handleCardChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = stripNonDigits(e.target.value).slice(
      0,
      expectedLength(stripNonDigits(e.target.value)),
    );
    setCardDigits(digits);
  };

  const updateTxn = (idx: number, patch: Partial<TxnEntry>) => {
    setTransactions((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  };

  const addTxnRow = () => {
    setTransactions((rows) => [
      ...rows,
      { amount: "", timestamp: nowForDatetimeLocal() },
    ]);
  };

  const removeTxnRow = (idx: number) => {
    setTransactions((rows) =>
      rows.length <= 1 ? rows : rows.filter((_, i) => i !== idx),
    );
  };

  const handleAmountChange =
    (setter: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "" || AMOUNT_INPUT_REGEX.test(raw)) setter(raw);
    };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (mode === "create") {
      const payload = {
        cardNumber: cardDigits,
        holderName,
        transactions,
      };
      const result = cardFormSchema.safeParse(payload);
      if (!result.success) {
        const fe: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fe[issue.path.join(".")] = issue.message;
        }
        setErrors(fe);
        return;
      }
      setErrors({});
      onSubmit({
        cardNumber: result.data.cardNumber,
        holderName: (result.data.holderName as string | undefined) || undefined,
        transactions: result.data.transactions,
      });
      return;
    }

    const payload = {
      holderName,
      amount: editAmount === "" ? undefined : editAmount,
      timestamp: editAmount === "" ? undefined : editTimestamp,
    };
    const result = cardUpdateFormSchema.safeParse(payload);
    if (!result.success) {
      const fe: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fe[issue.path.join(".")] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {mode === "create" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="card-number"
              className="block text-sm font-medium text-ink"
            >
              Card number <span className="text-danger">*</span>
            </label>
            {brand && <CardBrandIcon type={brand} />}
          </div>
          <div
            className={`flex items-center rounded-[10px] border bg-white focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 focus-within:ring-offset-canvas ${
              errors.cardNumber
                ? "border-danger"
                : "border-brand-200 hover:border-brand-400"
            }`}
          >
            <input
              id="card-number"
              value={formatted}
              onChange={handleCardChange}
              placeholder={
                expected === 15 ? "34** ****** **** *" : "**** **** **** ****"
              }
              inputMode="numeric"
              autoComplete="cc-number"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm tracking-wider text-ink placeholder:text-ink-muted focus:outline-none"
              aria-invalid={!!errors.cardNumber}
              aria-describedby="card-number-hint"
              required
            />
          </div>
          <div
            id="card-number-hint"
            className="flex items-center justify-between text-xs"
          >
            <span
              className={errors.cardNumber ? "text-danger" : "text-ink-muted"}
            >
              {errors.cardNumber ??
                "Digits only. Amex = 15 (groups of 5). Visa / MC / Discover = 16 (groups of 4)."}
            </span>
            <span
              className={
                cardDigits.length === expected && brand
                  ? "font-medium text-success"
                  : "text-ink-muted"
              }
            >
              {cardDigits.length}/{expected} digits
            </span>
          </div>
        </div>
      )}

      {mode === "edit" && initial?.maskedNumber && (
        <div className="flex items-center justify-between rounded-[10px] bg-brand-50 px-3 py-2 text-sm">
          <div>
            <span className="text-ink-muted">Card number: </span>
            <span className="font-mono text-ink">{initial.maskedNumber}</span>
          </div>
          {initial.cardType && <CardBrandIcon type={initial.cardType} />}
        </div>
      )}

      <Input
        label="Cardholder name (optional)"
        value={holderName ?? ""}
        onChange={(e) => setHolderName(e.target.value)}
        error={errors.holderName}
        maxLength={80}
      />

      {mode === "create" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Transactions</h3>
              <p className="text-xs text-ink-muted">Add one or more.</p>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {transactions.length} row{transactions.length === 1 ? "" : "s"}
            </span>
          </div>

          <div
            className={`space-y-3 ${
              transactions.length > 2
                ? "max-h-[420px] overflow-y-auto rounded-[12px] border border-brand-100 bg-brand-50/30 p-2 pr-3"
                : ""
            }`}
          >
            {transactions.map((row, idx) => {
              const amountErr = errors[`transactions.${idx}.amount`];
              const tsErr = errors[`transactions.${idx}.timestamp`];
              return (
                <div
                  key={idx}
                  className="rounded-[12px] border border-brand-100 bg-brand-50/50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-brand-700">
                      Transaction #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-red-50 disabled:opacity-40"
                      onClick={() => removeTxnRow(idx)}
                      disabled={transactions.length <= 1}
                      aria-label={`Remove transaction ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`txn-amount-${idx}`}
                        className="block text-sm font-medium text-ink"
                      >
                        Amount <span className="text-danger">*</span>
                      </label>
                      <div
                        className={`flex items-center rounded-[10px] border bg-white focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 focus-within:ring-offset-canvas ${
                          amountErr
                            ? "border-danger"
                            : "border-brand-200 hover:border-brand-400"
                        }`}
                      >
                        <span
                          className="pl-3 pr-1 text-sm font-medium text-ink-muted"
                          aria-hidden
                        >
                          $
                        </span>
                        <input
                          id={`txn-amount-${idx}`}
                          value={row.amount}
                          onChange={handleAmountChange((v) =>
                            updateTxn(idx, { amount: v }),
                          )}
                          placeholder="0.00"
                          inputMode="decimal"
                          className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                          aria-invalid={!!amountErr}
                          required
                        />
                        <span className="pr-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                          USD
                        </span>
                      </div>
                      <p
                        className={`text-xs ${amountErr ? "text-danger" : "text-ink-muted"}`}
                      >
                        {amountErr ??
                          `Up to $${AMOUNT_MAX.toLocaleString()}. Negatives allowed.`}
                      </p>
                    </div>
                    <Input
                      label={
                        <>
                          Datetime <span className="text-danger">*</span>
                        </>
                      }
                      type="datetime-local"
                      value={row.timestamp}
                      onChange={(e) =>
                        updateTxn(idx, { timestamp: e.target.value })
                      }
                      error={tsErr}
                      required
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {errors.transactions &&
            !Object.keys(errors).some((k) => k.startsWith("transactions.")) && (
              <p className="text-xs text-danger">{errors.transactions}</p>
            )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addTxnRow}
            disabled={transactions.length >= 50}
          >
            <Plus className="h-4 w-4" /> Add another transaction
          </Button>
        </div>
      )}

      {mode === "edit" && (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            Leave amount and datetime empty to only update the cardholder name.
            Fill both to append a new transaction to this card.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="card-amount"
                className="block text-sm font-medium text-ink"
              >
                Transaction amount
              </label>
              <div
                className={`flex items-center rounded-[10px] border bg-white focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 focus-within:ring-offset-canvas ${
                  errors.amount
                    ? "border-danger"
                    : "border-brand-200 hover:border-brand-400"
                }`}
              >
                <span
                  className="pl-3 pr-1 text-sm font-medium text-ink-muted"
                  aria-hidden
                >
                  $
                </span>
                <input
                  id="card-amount"
                  value={editAmount}
                  onChange={handleAmountChange(setEditAmount)}
                  placeholder="0.00"
                  inputMode="decimal"
                  className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                  aria-invalid={!!errors.amount}
                />
                <span className="pr-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
                  USD
                </span>
              </div>
              <p
                className={`text-xs ${errors.amount ? "text-danger" : "text-ink-muted"}`}
              >
                {errors.amount ??
                  `Up to $${AMOUNT_MAX.toLocaleString()}. Negative amounts allowed.`}
              </p>
            </div>
            <Input
              label="Transaction datetime"
              type="datetime-local"
              value={editTimestamp}
              onChange={(e) => setEditTimestamp(e.target.value)}
              error={errors.timestamp}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {mode === "create" ? "Create card" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
