import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchShowcaseStats, type ShowcaseStats } from '../../actions/public.actions';
import { formatCompactMoney, formatLatency, formatPercent } from '../../lib/format';

/**
 * Decorative right-pane illustration for the login screen.
 * Solid SignaPay blue (#0E4C90) with glassmorphism + premium card visuals.
 *
 * KPI strip is powered by GET /api/public/showcase-stats (unauthenticated).
 * If the fetch fails (server offline / network blip), placeholders ("—") render
 * instead of a broken UI — this pane is illustrative, never load-bearing.
 */
export function LoginShowcase() {
  const [stats, setStats] = useState<ShowcaseStats | null>(null);

  useEffect(() => {
    let alive = true;
    fetchShowcaseStats()
      .then((s) => {
        if (alive) setStats(s);
      })
      .catch(() => {
        /* swallow — the UI already degrades gracefully to dashes */
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div
      className="relative hidden h-full w-full overflow-hidden lg:block"
      style={{ backgroundColor: '#0E4C90' }}
    >
      {/* ambient halos for depth */}
      <div
        aria-hidden
        className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-24 h-[32rem] w-[32rem] rounded-full opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(6,36,80,0.9) 0%, rgba(6,36,80,0) 70%)',
        }}
      />

      {/* dotted grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* receipt (bg, glass) */}
      <div
        aria-hidden
        className="absolute left-[10%] top-[9%] hidden w-36 rotate-[-8deg] rounded-[10px] border border-white/30 bg-white/20 p-4 shadow-pop backdrop-blur-md xl:block"
      >
        <div className="h-1.5 w-10 rounded bg-white/70" />
        <div className="mt-2 space-y-1.5">
          <div className="h-1 w-full rounded bg-white/50" />
          <div className="h-1 w-5/6 rounded bg-white/50" />
          <div className="h-1 w-2/3 rounded bg-white/50" />
          <div className="h-1 w-4/5 rounded bg-white/50" />
        </div>
        <div className="mt-3 flex justify-between">
          <div className="h-2 w-8 rounded bg-white/50" />
          <div className="h-2 w-10 rounded bg-white/80" />
        </div>
        <div
          className="mt-2 h-2 w-full"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent 0 4px, rgba(255,255,255,0.45) 4px 6px)',
          }}
        />
      </div>

      {/* ============================================================
           TOP CARD — metallic cream, premium finish
          ============================================================ */}
      <div
        aria-hidden
        className="group absolute right-[12%] top-[12%] h-52 w-[22rem] rotate-[6deg] overflow-hidden rounded-[20px]"
        style={{
          boxShadow:
            '0 20px 50px -15px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.35) inset',
        }}
      >
        {/* base metallic gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #F8F1DD 0%, #EDE1C2 35%, #D9C79A 70%, #F4E8CA 100%)',
          }}
        />
        {/* diagonal shine */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 60%)',
          }}
        />
        {/* subtle embossed grain */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.08), transparent 40%)',
          }}
        />
        {/* content */}
        <div className="relative flex h-full flex-col justify-between p-6 text-brand-900/80">
          <div className="flex items-start justify-between">
            {/* metallic chip */}
            <div
              className="relative h-10 w-14 rounded-md p-1"
              style={{
                background:
                  'linear-gradient(135deg, #F2D06B 0%, #C69A3A 40%, #9C7226 70%, #E3BC5C 100%)',
              }}
            >
              <div className="grid h-full grid-cols-2 gap-[2px]">
                <div className="rounded-[2px] bg-yellow-900/40" />
                <div className="rounded-[2px] bg-yellow-900/40" />
                <div className="rounded-[2px] bg-yellow-900/40" />
                <div className="rounded-[2px] bg-yellow-900/40" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* contactless icon */}
              <ContactlessIcon className="h-5 w-5 rotate-90 text-brand-900/50" />
              <div className="font-display text-[11px] font-bold tracking-[0.2em] text-brand-900/75">
                SIGNAPAY
              </div>
            </div>
          </div>
          <div>
            <div className="flex gap-3 font-mono text-[15px] font-semibold tracking-[0.18em] text-brand-900/75">
              <span>••••</span>
              <span>••••</span>
              <span>••••</span>
              <span>4921</span>
            </div>
            <div className="mt-3 flex items-end justify-between text-[9px] uppercase tracking-[0.18em] text-brand-900/65">
              <div>
                <div className="opacity-60">Cardholder</div>
                <div className="mt-0.5 font-semibold">M. REYES</div>
              </div>
              <div>
                <div className="opacity-60">Valid thru</div>
                <div className="mt-0.5 font-semibold">06 / 29</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
           BOTTOM CARD — pure crystal glass
          ============================================================ */}
      <div
        aria-hidden
        className="absolute left-[22%] top-[40%] h-56 w-[24rem] rotate-[-5deg] overflow-hidden rounded-[20px]"
        style={{
          boxShadow:
            '0 30px 60px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.25) inset, 0 0 40px rgba(255,255,255,0.08) inset',
        }}
      >
        {/* frosted glass base */}
        <div
          className="absolute inset-0 backdrop-blur-2xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.18) 100%)',
          }}
        />
        {/* top-left highlight (glass reflection) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 40%)',
          }}
        />
        {/* subtle color bleed */}
        <div
          className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full opacity-50"
          style={{
            background:
              'radial-gradient(circle, rgba(226,87,76,0.4), transparent 70%)',
          }}
        />
        {/* content */}
        <div className="relative flex h-full flex-col justify-between p-7 text-white">
          <div className="flex items-start justify-between">
            {/* metallic silver-ish chip */}
            <div
              className="relative h-10 w-14 rounded-md p-1"
              style={{
                background:
                  'linear-gradient(135deg, #E8E4D3 0%, #B8AE88 45%, #8A8067 75%, #E8E4D3 100%)',
              }}
            >
              <div className="grid h-full grid-cols-2 gap-[2px]">
                <div className="rounded-[2px] bg-black/15" />
                <div className="rounded-[2px] bg-black/15" />
                <div className="rounded-[2px] bg-black/15" />
                <div className="rounded-[2px] bg-black/15" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ContactlessIcon className="h-5 w-5 rotate-90 text-white/70" />
              {/* network logo marks */}
              <div className="relative flex">
                <div className="h-6 w-6 rounded-full bg-accent-500/90" />
                <div className="-ml-3 h-6 w-6 rounded-full bg-accent-400/85" />
              </div>
            </div>
          </div>
          <div>
            <div
              className="font-mono text-[17px] font-semibold tracking-[0.22em]"
              style={{
                textShadow: '0 1px 1px rgba(0,0,0,0.25)',
              }}
            >
              4921 8823 0146 7709
            </div>
            <div className="mt-4 flex items-end justify-between text-[9px] uppercase tracking-[0.18em] text-white/85">
              <div>
                <div className="opacity-70">Cardholder</div>
                <div className="mt-0.5 font-semibold">J. MOREL</div>
              </div>
              <div>
                <div className="opacity-70">Valid thru</div>
                <div className="mt-0.5 font-semibold">11 / 27</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* approved callout (glass) */}
      <div className="absolute right-[10%] top-[30%] flex items-center gap-3 rounded-[12px] border border-white/45 bg-white/85 px-4 py-3 shadow-pop backdrop-blur-md">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">
            Approved · 00:02s
          </div>
          <div className="font-display text-sm font-semibold text-ink">$1,248.00</div>
        </div>
      </div>

      {/* declined callout (glass) */}
      <div className="absolute left-[16%] top-[64%] flex items-center gap-3 rounded-[12px] border border-white/45 bg-white/85 px-4 py-3 shadow-pop backdrop-blur-md">
        <XCircle className="h-5 w-5 text-danger" />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">
            Declined · AVS
          </div>
          <div className="font-display text-sm font-semibold text-ink">$89.50</div>
        </div>
      </div>

      {/* bar-chart accent */}
      <div
        className="absolute bottom-[24%] right-[6%] flex h-20 items-end gap-1"
        aria-hidden
      >
        {[14, 22, 18, 30, 24, 36, 28].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h * 2}px` }}
            className="w-2 rounded-t bg-white/40 backdrop-blur-sm"
          />
        ))}
      </div>

      {/* KPI strip (glass) */}
      <div className="absolute inset-x-8 bottom-6 rounded-[14px] border border-white/45 bg-white/85 p-5 shadow-pop backdrop-blur-md">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Today across the network
        </div>
        <div className="mt-3 grid grid-cols-3 gap-6">
          <div>
            <div className="font-display text-xl font-bold text-ink">
              {formatCompactMoney(stats?.authorizedVolume)}
            </div>
            <div className="mt-0.5 text-xs text-ink-muted">Authorized volume</div>
          </div>
          <div>
            <div className="font-display text-xl font-bold text-ink">
              {formatPercent(stats?.approvalRate ?? null)}
            </div>
            <div className="mt-0.5 text-xs text-ink-muted">Approval rate</div>
          </div>
          <div>
            <div className="font-display text-xl font-bold text-ink">
              {formatLatency(stats?.p95LatencyMs ?? null)}
            </div>
            <div className="mt-0.5 text-xs text-ink-muted">P95 auth latency</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactlessIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6.8 8.2a6 6 0 0 1 0 7.6" />
      <path d="M10.2 10.2a3 3 0 0 1 0 3.6" />
      <path d="M3.4 5.6a10 10 0 0 1 0 12.8" />
    </svg>
  );
}
