import { Card, CardBody, CardHeader } from '../design-system/Card';
import { EmptyState } from '../design-system/EmptyState';
import { ByCardChart } from '../components/reports/ByCardChart';
import { ByCardTypeChart } from '../components/reports/ByCardTypeChart';
import { ByDayChart } from '../components/reports/ByDayChart';
import { RejectedByReasonChart } from '../components/reports/RejectedByReasonChart';
import {
  fetchByCard,
  fetchByCardType,
  fetchByDay,
  fetchRejectedByReason,
} from '../actions/report.actions';
import { useAsync } from '../hooks/useAsync';

export function ReportsPage() {
  const byTypeQ = useAsync(fetchByCardType, []);
  const byDayQ = useAsync(fetchByDay, []);
  const byCardQ = useAsync(fetchByCard, []);
  const rejectedReasonsQ = useAsync(fetchRejectedByReason, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Reports</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Accepted volume aggregated by card type, day, and card. Rejected transactions are broken
          down by reason.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-semibold text-ink">Volume by card type</h2>
          </CardHeader>
          <CardBody>
            {byTypeQ.state.status === 'success' ? (
              <ByCardTypeChart data={byTypeQ.state.data} />
            ) : (
              <div className="py-10 text-center text-sm text-ink-muted">Loading…</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-semibold text-ink">Volume by day</h2>
          </CardHeader>
          <CardBody>
            {byDayQ.state.status === 'success' ? (
              byDayQ.state.data.length === 0 ? (
                <EmptyState title="No accepted transactions yet" />
              ) : (
                <ByDayChart data={byDayQ.state.data} />
              )
            ) : (
              <div className="py-10 text-center text-sm text-ink-muted">Loading…</div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">
              Top cards by volume
            </h2>
            <span className="text-xs text-ink-muted">Top 10 accepted</span>
          </div>
        </CardHeader>
        <CardBody>
          {byCardQ.state.status === 'success' ? (
            byCardQ.state.data.length === 0 ? (
              <EmptyState title="No accepted transactions yet" />
            ) : (
              <ByCardChart rows={byCardQ.state.data} />
            )
          ) : (
            <div className="py-10 text-center text-sm text-ink-muted">Loading…</div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">
              Rejected transactions by reason
            </h2>
            {rejectedReasonsQ.state.status === 'success' && (
              <span className="text-xs text-ink-muted">
                {rejectedReasonsQ.state.data.length} reason
                {rejectedReasonsQ.state.data.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {rejectedReasonsQ.state.status === 'success' ? (
            rejectedReasonsQ.state.data.length === 0 ? (
              <EmptyState
                title="No rejected transactions"
                description="Everything ingested cleanly."
              />
            ) : (
              <RejectedByReasonChart rows={rejectedReasonsQ.state.data} />
            )
          ) : (
            <div className="py-10 text-center text-sm text-ink-muted">Loading…</div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
