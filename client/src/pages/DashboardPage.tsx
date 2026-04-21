import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Receipt,
  Settings,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody } from "../design-system/Card";
import { formatMoney } from "../lib/format";
import { fetchByDay, fetchSummary } from "../actions/report.actions";
import { useAsync } from "../hooks/useAsync";
import type { ByDayRow, Summary } from "../types/api";

type Metric = "volume" | "count" | "avg";

function Sparkbars({
  values,
  tone = "brand",
}: {
  values: number[];
  tone?: "brand" | "accent" | "success";
}) {
  const max = Math.max(1, ...values);
  const activeColor = {
    brand: "bg-brand-500",
    accent: "bg-accent-500",
    success: "bg-success",
  }[tone];
  const inactiveColor = {
    brand: "bg-brand-100",
    accent: "bg-accent-400/30",
    success: "bg-green-100",
  }[tone];
  return (
    <div className="flex h-10 items-end gap-[3px]">
      {values.map((v, i) => {
        const h = Math.max(8, Math.round((v / max) * 100));
        const isLast = i === values.length - 1;
        return (
          <div
            key={i}
            className={`w-full rounded-sm ${isLast ? activeColor : inactiveColor}`}
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}

function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null || !Number.isFinite(delta)) return null;
  const up = delta >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const tone = up ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
  sparks,
  tone = "brand",
}: {
  label: string;
  value: string;
  delta: number | null;
  sparks: number[];
  tone?: "brand" | "accent" | "success";
}) {
  return (
    <Card className="transition hover:shadow-pop">
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {label}
          </span>
          <DeltaPill delta={delta} />
        </div>
        <div className="font-display text-3xl font-bold text-ink">{value}</div>
        <Sparkbars values={sparks} tone={tone} />
      </CardBody>
    </Card>
  );
}

function computeDelta(series: number[]): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (!prev) return null;
  return ((last - prev) / prev) * 100;
}

function formatCompactMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return formatMoney(n);
}

function AreaChart({
  points,
  metric,
}: {
  points: { label: string; value: number }[];
  metric: Metric;
}) {
  const W = 900;
  const H = 280;
  const PAD_L = 52;
  const PAD_R = 20;
  const PAD_T = 24;
  const PAD_B = 32;

  const {
    linePath,
    areaPath,
    last,
    yTicks,
    xTicks,
  } = useMemo(() => {
    if (points.length === 0) {
      return {
        linePath: "",
        areaPath: "",
        last: null as null | { cx: number; cy: number; value: number; label: string },
        yTicks: [] as { y: number; value: number }[],
        xTicks: [] as { x: number; label: string }[],
      };
    }

    const values = points.map((p) => p.value);
    const rawMax = Math.max(...values, 0);
    const max = rawMax === 0 ? 1 : rawMax * 1.12;
    const n = points.length;
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;

    const x = (i: number) =>
      PAD_L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = (v: number) => PAD_T + innerH - (v / max) * innerH;

    const coords = points.map((p, i) => ({ x: x(i), y: y(p.value) }));

    // Catmull-Rom to cubic Bezier — smooth, monotone-ish curves without overshoot.
    const smooth = (pts: { x: number; y: number }[]) => {
      if (pts.length < 2) return `M ${pts[0].x} ${pts[0].y}`;
      const tension = 0.22;
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] ?? p2;
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;
        d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
      }
      return d;
    };

    const linePath = smooth(coords);
    const baseline = PAD_T + innerH;
    const areaPath =
      `${linePath} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`;

    const yTicks = [0, 0.5, 1].map((f) => ({
      y: PAD_T + innerH - f * innerH,
      value: f * max,
    }));

    const desired = Math.min(6, n);
    const xTicks: { x: number; label: string }[] = [];
    if (desired > 0) {
      for (let i = 0; i < desired; i++) {
        const idx =
          desired === 1 ? 0 : Math.round((i / (desired - 1)) * (n - 1));
        xTicks.push({ x: x(idx), label: points[idx].label });
      }
    }

    const lastIdx = n - 1;
    const last = {
      cx: x(lastIdx),
      cy: y(points[lastIdx].value),
      value: points[lastIdx].value,
      label: points[lastIdx].label,
    };

    return { linePath, areaPath, last, yTicks, xTicks };
  }, [points]);

  const formatAxis = (v: number) =>
    metric === "volume"
      ? formatCompactMoney(v)
      : Math.round(v).toLocaleString();
  const formatBadge = (v: number) =>
    metric === "volume"
      ? formatCompactMoney(v)
      : metric === "count"
        ? Math.round(v).toLocaleString()
        : formatCompactMoney(v);

  if (points.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-ink-muted">
        No activity yet — upload a file to populate this chart.
      </div>
    );
  }

  const badgeW = 88;
  const badgeH = 26;
  const badgeX = Math.min(
    W - PAD_R - badgeW,
    Math.max(PAD_L, (last?.cx ?? 0) - badgeW / 2),
  );
  const badgeY = Math.max(PAD_T, (last?.cy ?? 0) - badgeH - 12);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-[280px] w-full"
      role="img"
      aria-label="Authorization activity trend"
    >
      <defs>
        <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0E4C90" stopOpacity="0.16" />
          <stop offset="70%" stopColor="#0E4C90" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#0E4C90" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="line-stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#4E7FC2" />
          <stop offset="100%" stopColor="#0E4C90" />
        </linearGradient>
        <filter id="line-shadow" x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
        </filter>
      </defs>

      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={t.y}
            y2={t.y}
            stroke="#E5ECF6"
            strokeWidth={1}
          />
          <text
            x={PAD_L - 10}
            y={t.y + 3}
            textAnchor="end"
            fontSize={10}
            fontWeight={500}
            fill="#94A3B8"
          >
            {formatAxis(t.value)}
          </text>
        </g>
      ))}

      <path d={areaPath} fill="url(#area-fill)" />

      {/* Soft glow under the line for a premium feel. */}
      <path
        d={linePath}
        fill="none"
        stroke="#0E4C90"
        strokeOpacity={0.15}
        strokeWidth={5}
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#line-shadow)"
      />

      <path
        d={linePath}
        fill="none"
        stroke="url(#line-stroke)"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {last && (
        <>
          {/* Halo + point marker only on the latest value. */}
          <circle cx={last.cx} cy={last.cy} r={9} fill="#0E4C90" opacity={0.08} />
          <circle cx={last.cx} cy={last.cy} r={5} fill="#FFFFFF" />
          <circle cx={last.cx} cy={last.cy} r={3.25} fill="#0E4C90" />

          {/* Floating value badge. */}
          <g transform={`translate(${badgeX}, ${badgeY})`}>
            <rect
              width={badgeW}
              height={badgeH}
              rx={13}
              ry={13}
              fill="#0A2540"
            />
            <text
              x={badgeW / 2}
              y={badgeH / 2 + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill="#FFFFFF"
            >
              {formatBadge(last.value)}
            </text>
          </g>
        </>
      )}

      {xTicks.map((t, i) => (
        <text
          key={i}
          x={t.x}
          y={H - 10}
          fontSize={10}
          fontWeight={500}
          textAnchor="middle"
          fill="#94A3B8"
        >
          {t.label}
        </text>
      ))}
    </svg>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  description,
  tone,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tone: "navy" | "accent" | "slate";
}) {
  const toneClasses: Record<typeof tone, string> = {
    navy: "bg-gradient-to-br from-brand-900 to-brand-700 text-white",
    accent: "bg-gradient-to-br from-accent-500 to-accent-400 text-white",
    slate: "bg-gradient-to-br from-slate-800 to-slate-700 text-white",
  };
  return (
    <Link
      to={to}
      className="group block rounded-[12px] border border-brand-100 bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-[10px] shadow-sm ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-ink group-hover:text-brand-700">
            {title}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function selectMetric(row: ByDayRow, metric: Metric): number {
  if (metric === "volume") return Number(row.total);
  if (metric === "count") return row.count;
  return row.count > 0 ? Number(row.total) / row.count : 0;
}

function formatMetricTotal(rows: ByDayRow[], metric: Metric): string {
  if (metric === "volume") {
    const sum = rows.reduce((a, r) => a + Number(r.total), 0);
    return formatCompactMoney(sum);
  }
  if (metric === "count") {
    const sum = rows.reduce((a, r) => a + r.count, 0);
    return sum.toLocaleString();
  }
  const totalVol = rows.reduce((a, r) => a + Number(r.total), 0);
  const totalCount = rows.reduce((a, r) => a + r.count, 0);
  return formatCompactMoney(totalCount > 0 ? totalVol / totalCount : 0);
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DashboardPage() {
  const { state: summaryState } = useAsync<Summary>(fetchSummary, []);
  const { state: byDayState } = useAsync<ByDayRow[]>(fetchByDay, []);
  const [metric, setMetric] = useState<Metric>("volume");

  const summary = summaryState.status === "success" ? summaryState.data : null;
  const byDay = byDayState.status === "success" ? byDayState.data : [];

  const recent = useMemo(() => byDay.slice(-30), [byDay]);
  const recentSparks = useMemo(() => byDay.slice(-12), [byDay]);

  const volumeSeries = recentSparks.map((r) => Number(r.total));
  const countSeries = recentSparks.map((r) => r.count);

  const approvalRate =
    summary && summary.transactions > 0
      ? (summary.accepted / summary.transactions) * 100
      : null;

  const chartPoints = recent.map((r) => ({
    label: formatDayLabel(r.date),
    value: selectMetric(r, metric),
  }));

  const metricTabs: { key: Metric; label: string }[] = [
    { key: "volume", label: "Volume" },
    { key: "count", label: "Count" },
    { key: "avg", label: "Avg size" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-[16px] bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-6 text-white shadow-pop">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold leading-tight">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-white/80">
                Real-time view of processed transactions and card activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Volume"
          value={
            summary ? formatCompactMoney(Number(summary.totalVolume)) : "—"
          }
          delta={computeDelta(volumeSeries)}
          sparks={volumeSeries.length ? volumeSeries : [0]}
          tone="brand"
        />
        <KpiCard
          label="Transactions"
          value={summary ? summary.transactions.toLocaleString() : "—"}
          delta={computeDelta(countSeries)}
          sparks={countSeries.length ? countSeries : [0]}
          tone="accent"
        />
        <KpiCard
          label="Approval Rate"
          value={approvalRate !== null ? `${approvalRate.toFixed(1)}%` : "—"}
          delta={null}
          sparks={countSeries.length ? countSeries : [0]}
          tone="success"
        />
        <KpiCard
          label="Active Cards"
          value={summary ? summary.cards.toLocaleString() : "—"}
          delta={null}
          sparks={countSeries.length ? countSeries : [0]}
          tone="brand"
        />
      </div>

      {/* Chart */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-100 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Authorization activity
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Daily, last {recent.length || 0} day
              {recent.length === 1 ? "" : "s"} · accepted transactions
            </p>
          </div>
          <div className="inline-flex rounded-full border border-brand-200 bg-white p-0.5 text-xs shadow-sm">
            {metricTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setMetric(t.key)}
                className={`rounded-full px-3 py-1.5 font-medium transition ${
                  metric === t.key
                    ? "bg-brand-900 text-white"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <CardBody className="pt-2">
          <AreaChart points={chartPoints} metric={metric} />
          <div className="mt-3 flex items-center gap-4 border-t border-brand-100 pt-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" />
              <span className="text-ink-muted">This period ·</span>
              <span className="font-semibold text-ink">
                {formatMetricTotal(recent, metric)}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            to="/transactions"
            icon={Upload}
            title="Add transactions"
            description="Create a card manually or upload CSV / JSON / XML in bulk."
            tone="navy"
          />
          <QuickLink
            to="/transactions"
            icon={Receipt}
            title="Browse records"
            description="Filter transactions by card type, date range, and amount."
            tone="accent"
          />
          <QuickLink
            to="/reports"
            icon={BarChart3}
            title="Run reports"
            description="Volume by card, card type, and day. Inspect rejection reasons."
            tone="slate"
          />
          <QuickLink
            to="/settings"
            icon={Settings}
            title="Account settings"
            description="View your profile, role, and end the current session."
            tone="navy"
          />
        </div>
      </div>

      {/* Small status footer */}
      {summary && (
        <div className="flex flex-wrap items-center gap-4 rounded-[12px] border border-brand-100 bg-surface px-5 py-3 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            {summary.accepted.toLocaleString()} accepted
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand-700" />
            {summary.cards.toLocaleString()} cards on file
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-brand-700" />
            Total processed: {formatMoney(summary.totalVolume)}
          </div>
        </div>
      )}
    </div>
  );
}
