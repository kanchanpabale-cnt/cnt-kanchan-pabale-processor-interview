import { AxiosError } from "axios";
import {
  CreditCard,
  Filter,
  ListFilter,
  PenLine,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../design-system/Button";
import { Card, CardBody } from "../design-system/Card";
import { EmptyState } from "../design-system/EmptyState";
import { Input } from "../design-system/Input";
import { Pagination } from "../design-system/Pagination";
import { Select } from "../design-system/Select";
import {
  CardForm,
  type CardFormSubmitValues,
} from "../components/cards/CardForm";
import { TransactionsTable } from "../components/transactions/TransactionsTable";
import { UploadDropzone } from "../components/transactions/UploadDropzone";
import { createCard } from "../actions/card.actions";
import {
  listTransactions,
  uploadTransactions,
  type ListTransactionsQuery,
} from "../actions/transaction.actions";
import { useAsync } from "../hooks/useAsync";
import { useAuth } from "../hooks/useAuth";
import { useUiStore } from "../store/ui.store";
import type { CardType } from "../types/api";

type CardTypeFilter = "" | CardType;
type StatusFilter = "" | "ACCEPTED" | "REJECTED";
type EntryMode = "manual" | "upload";

const PAGE_SIZE = 25;
const AMOUNT_FILTER_REGEX = /^-?\d*(\.\d{0,2})?$/;

function localToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  tone,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  tone: "navy" | "accent" | "slate";
  right?: React.ReactNode;
}) {
  const toneClasses: Record<typeof tone, string> = {
    navy: "bg-gradient-to-r from-brand-900 to-brand-700 text-white",
    accent: "bg-gradient-to-r from-accent-500 to-accent-400 text-white",
    slate: "bg-gradient-to-r from-slate-800 to-slate-700 text-white",
  };
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-t-[12px] px-5 py-3.5 ${toneClasses[tone]}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold leading-tight">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-white/75">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function CardsTransactionsPage() {
  const { isAdmin } = useAuth();
  const pushToast = useUiStore((s) => s.pushToast);

  const [uploading, setUploading] = useState(false);
  const [submittingCard, setSubmittingCard] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>("manual");
  const [cardFormKey, setCardFormKey] = useState(0);

  const [cardType, setCardType] = useState<CardTypeFilter>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [page, setPage] = useState(1);

  const query = useMemo<ListTransactionsQuery>(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      cardType: cardType || undefined,
      status: status || undefined,
      from: localToIso(from),
      to: localToIso(to),
      minAmount:
        minAmount.trim() !== "" && minAmount !== "-" ? minAmount : undefined,
      maxAmount:
        maxAmount.trim() !== "" && maxAmount !== "-" ? maxAmount : undefined,
    }),
    [page, cardType, status, from, to, minAmount, maxAmount],
  );

  const { state, refresh } = useAsync(() => listTransactions(query), [query]);

  const resetToFirstPage = () => setPage(1);

  const handleCreateCard = async (values: CardFormSubmitValues) => {
    if (!values.cardNumber || !values.transactions?.length) return;
    setSubmittingCard(true);
    try {
      await createCard({
        cardNumber: values.cardNumber,
        holderName: values.holderName || undefined,
        transactions: values.transactions,
      });
      pushToast(
        "success",
        `Card created with ${values.transactions.length} transaction${values.transactions.length === 1 ? "" : "s"}`,
      );
      setCardFormKey((k) => k + 1);
      resetToFirstPage();
      refresh();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      pushToast("error", ax.response?.data?.message ?? "Could not create card");
    } finally {
      setSubmittingCard(false);
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const batch = await uploadTransactions(file);
      pushToast(
        "success",
        `Ingested ${batch.filename}: ${batch.acceptedRows} accepted, ${batch.rejectedRows} rejected`,
      );
      resetToFirstPage();
      refresh();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      pushToast("error", ax.response?.data?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearFilters = () => {
    setCardType("");
    setStatus("");
    setFrom("");
    setTo("");
    setMinAmount("");
    setMaxAmount("");
    setPage(1);
  };

  const handleAmountFilter =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "" || AMOUNT_FILTER_REGEX.test(raw)) {
        resetToFirstPage();
        setter(raw);
      }
    };

  const total = state.status === "success" ? state.data.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="overflow-hidden rounded-[16px] bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-6 text-white shadow-pop">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight">
              Cards &amp; Transactions
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Add a card manually, or upload a batch file, and review every
              transaction in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Add transactions — side-by-side manual vs upload */}
      {isAdmin && (
        <div>
          {/* Mode toggle for narrow screens */}
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Add transactions
            </h2>
            <div className="inline-flex rounded-full border border-brand-200 bg-white p-0.5 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setEntryMode("manual")}
                className={`rounded-full px-3 py-1.5 font-medium transition ${
                  entryMode === "manual"
                    ? "bg-brand-900 text-white"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("upload")}
                className={`rounded-full px-3 py-1.5 font-medium transition ${
                  entryMode === "upload"
                    ? "bg-accent-500 text-white"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Upload
              </button>
            </div>
          </div>

          <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Manual entry */}
            <Card
              className={`${entryMode === "manual" ? "" : "hidden"} overflow-hidden lg:block`}
            >
              <SectionHeader
                icon={PenLine}
                title="Manual entry"
                subtitle="Create a card with one or more transactions"
                tone="navy"
              />
              <CardBody>
                <CardForm
                  key={cardFormKey}
                  mode="create"
                  submitting={submittingCard}
                  onSubmit={handleCreateCard}
                />
              </CardBody>
            </Card>

            {/* OR divider — centered between panels */}
            <div
              className="pointer-events-none absolute inset-y-6 left-1/2 hidden -translate-x-1/2 flex-col items-center lg:flex"
              aria-hidden
            >
              <div className="flex-1 w-px bg-gradient-to-b from-transparent via-brand-200 to-brand-200" />
              <span className="my-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 shadow-sm">
                OR
              </span>
              <div className="flex-1 w-px bg-gradient-to-b from-brand-200 via-brand-200 to-transparent" />
            </div>

            {/* Upload */}
            <Card
              className={`${entryMode === "upload" ? "" : "hidden"} overflow-hidden lg:block`}
            >
              <SectionHeader
                icon={UploadCloud}
                title="Upload file"
                subtitle="Drop a .csv, .json, or .xml batch"
                tone="accent"
              />
              <CardBody>
                <UploadDropzone uploading={uploading} onFile={handleFile} />
                <p className="mt-3 rounded-[10px] bg-brand-50 px-3 py-2 text-xs text-ink-muted">
                  Tip: sample files live in{" "}
                  <span className="font-mono">data/</span> — drag one in to see
                  a full ingestion batch.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Transactions */}
      <Card className="overflow-hidden">
        <SectionHeader
          icon={CreditCard}
          title="Transactions"
          subtitle={
            state.status === "success"
              ? `${state.data.total.toLocaleString()} record${state.data.total === 1 ? "" : "s"} matching`
              : "All transactions, filtered server-side"
          }
          tone="slate"
          right={
            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Refresh
            </Button>
          }
        />

        <div className="border-b border-brand-100 bg-canvas px-5 py-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Select
              label="Card type"
              value={cardType}
              onChange={(e) => {
                resetToFirstPage();
                setCardType(e.target.value as CardTypeFilter);
              }}
            >
              <option value="">All types</option>
              <option value="AMEX">American Express</option>
              <option value="VISA">Visa</option>
              <option value="MASTERCARD">MasterCard</option>
              <option value="DISCOVER">Discover</option>
            </Select>
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                resetToFirstPage();
                setStatus(e.target.value as StatusFilter);
              }}
            >
              <option value="">All</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </Select>
            <Input
              label="From"
              type="datetime-local"
              value={from}
              onChange={(e) => {
                resetToFirstPage();
                setFrom(e.target.value);
              }}
            />
            <Input
              label="To"
              type="datetime-local"
              value={to}
              onChange={(e) => {
                resetToFirstPage();
                setTo(e.target.value);
              }}
            />
            <Input
              label="Min amount"
              inputMode="decimal"
              placeholder="-100.00"
              value={minAmount}
              onChange={handleAmountFilter(setMinAmount)}
            />
            <Input
              label="Max amount"
              inputMode="decimal"
              placeholder="1000.00"
              value={maxAmount}
              onChange={handleAmountFilter(setMaxAmount)}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <ListFilter className="h-4 w-4" /> Clear filters
            </Button>
          </div>
        </div>

        <CardBody className="p-0">
          {state.status === "loading" && (
            <div className="p-10 text-center text-sm text-ink-muted">
              Loading transactions…
            </div>
          )}
          {state.status === "error" && (
            <div className="p-10 text-center text-sm text-danger">
              Error loading transactions.
            </div>
          )}
          {state.status === "success" && state.data.items.length === 0 && (
            <EmptyState
              title="No transactions match"
              description="Adjust the filters above or add transactions to get started."
            />
          )}
          {state.status === "success" && state.data.items.length > 0 && (
            <>
              <TransactionsTable items={state.data.items} />
              <div className="flex flex-col items-center justify-between gap-3 border-t border-brand-100 bg-canvas px-4 py-3 text-sm md:flex-row">
                <span className="text-ink-muted">
                  Showing{" "}
                  <span className="font-semibold text-ink">
                    {(state.data.page - 1) * PAGE_SIZE + 1}
                    {"–"}
                    {Math.min(
                      state.data.page * PAGE_SIZE,
                      state.data.total,
                    )}
                  </span>{" "}
                  of {state.data.total.toLocaleString()} transactions
                </span>
                <Pagination
                  page={state.data.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
