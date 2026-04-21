import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CardForm, type CardFormSubmitValues } from '../components/cards/CardForm';
import { Card, CardBody, CardHeader } from '../design-system/Card';
import { getCard, updateCard } from '../actions/card.actions';
import { useUiStore } from '../store/ui.store';
import type { Card as CardType } from '../types/api';

interface Props {
  mode: 'create' | 'edit';
}

export function CardFormPage({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const [initial, setInitial] = useState<CardType | undefined>(undefined);
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    setLoading(true);
    getCard(id)
      .then(setInitial)
      .catch(() => pushToast('error', 'Card not found'))
      .finally(() => setLoading(false));
  }, [mode, id, pushToast]);

  const handleSubmit = async (values: CardFormSubmitValues) => {
    if (mode !== 'edit' || !id) return;
    setSubmitting(true);
    try {
      await updateCard(id, {
        holderName: values.holderName ?? null,
        amount: values.amount,
        timestamp: values.timestamp,
      });
      pushToast(
        'success',
        values.amount ? 'Card updated and transaction appended' : 'Card updated',
      );
      navigate('/transactions');
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      pushToast('error', ax.response?.data?.message ?? 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Edit Card</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Update cardholder details, and optionally append a new transaction.
        </p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-display text-base font-semibold text-ink">Card details</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="py-6 text-center text-sm text-ink-muted">Loading…</div>
          ) : (
            <CardForm
              mode={mode}
              initial={initial}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/transactions')}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
