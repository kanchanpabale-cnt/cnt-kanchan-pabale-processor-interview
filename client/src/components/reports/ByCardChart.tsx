import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '../../lib/format';
import type { ByCardRow } from '../../types/api';

const TOP_N = 10;
const PALETTE = ['#0E4C90', '#4E7FC2', '#0A3A70', '#AEC4E4', '#E2574C'];

export function ByCardChart({ rows }: { rows: ByCardRow[] }) {
  const chart = [...rows]
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, TOP_N)
    .map((r) => ({
      label: r.holderName
        ? `${r.holderName} · ${r.last4 ?? '—'}`
        : `•••• ${r.last4 ?? '—'}`,
      total: Number(r.total),
      count: r.count,
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, chart.length * 38)}>
      <BarChart
        data={chart}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 12 }}
        barCategoryGap={10}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5ECF6" horizontal={false} />
        <XAxis
          type="number"
          stroke="#94A3B8"
          fontSize={11}
          tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
        />
        <YAxis
          type="category"
          dataKey="label"
          stroke="#64748B"
          fontSize={11}
          width={170}
          tick={{ fill: '#0F172A' }}
        />
        <Tooltip
          cursor={{ fill: 'rgba(14, 76, 144, 0.06)' }}
          formatter={(value: number, _name, entry) => [
            formatMoney(value),
            `${entry.payload.count} txn${entry.payload.count === 1 ? '' : 's'}`,
          ]}
          contentStyle={{ borderRadius: 10, border: '1px solid #D8E3F3', fontSize: 12 }}
        />
        <Bar dataKey="total" radius={[0, 6, 6, 0]}>
          {chart.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
