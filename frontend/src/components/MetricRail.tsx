'use client';

import type { FinancialMetrics } from '@/types/report';

interface MetricRailProps {
  metrics: FinancialMetrics;
}

function MetricCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 bg-card border border-card-border rounded-lg">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
        {label}
      </p>
      {children}
    </div>
  );
}

function TrendBar({
  current,
  previous,
  suffix = '%',
  inverted = false,
}: {
  current: number;
  previous: number | null;
  suffix?: string;
  inverted?: boolean;
}) {
  const isDecline = previous !== null && current < previous;
  const barColor = (inverted ? !isDecline : isDecline)
    ? 'bg-red-500'
    : 'bg-emerald-500';
  const textColor = (inverted ? !isDecline : isDecline)
    ? 'text-red-400'
    : 'text-emerald-400';
  const pct = previous ? Math.min((Math.abs(current) / Math.abs(previous)) * 100, 100) : 50;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        {previous !== null && (
          <span className="text-xs text-muted-foreground">
            {previous}
            {suffix}
          </span>
        )}
        <span className={`text-sm font-bold ${textColor}`}>
          {current}
          {suffix}
        </span>
      </div>
      <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {previous !== null && (
        <p className="text-[10px] text-muted-foreground">
          {isDecline ? '↓' : '↑'} from {previous}
          {suffix}
        </p>
      )}
    </div>
  );
}

function Thermometer({ value, max, peerAvg }: { value: number; max: number; peerAvg: number | null }) {
  const pct = Math.min((value / max) * 100, 100);
  const isOverheated = pct > 60;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className={`text-sm font-bold ${isOverheated ? 'text-red-400' : 'text-amber-400'}`}>
          {value.toFixed(1)}x
        </span>
        {peerAvg && (
          <span className="text-xs text-muted-foreground">Peer ~{peerAvg}x</span>
        )}
      </div>
      <div className="h-2 bg-card-border rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isOverheated
              ? 'bg-gradient-to-r from-amber-500 to-red-500'
              : 'bg-gradient-to-r from-emerald-500 to-amber-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isOverheated && (
        <p className="text-[10px] text-red-400/80 font-medium">Overheated</p>
      )}
    </div>
  );
}

export default function MetricRail({ metrics }: MetricRailProps) {
  const {
    peRatio,
    pegRatio,
    grossMarginCurrent,
    grossMarginPrevious,
    revenueGrowthCurrent,
    freeCashFlow,
    epsCurrent,
    epsPrevious,
    peerPeAvg,
  } = metrics;

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-1">
        Key Metrics
      </h3>

      {/* Profitability Health */}
      {(grossMarginCurrent !== null || revenueGrowthCurrent !== null) && (
        <MetricCard label="Profitability Health">
          <div className="space-y-3">
            {grossMarginCurrent !== null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Gross Margin</p>
                <TrendBar
                  current={grossMarginCurrent}
                  previous={grossMarginPrevious}
                />
              </div>
            )}
            {revenueGrowthCurrent !== null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Revenue Growth</p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-sm font-bold ${
                      revenueGrowthCurrent < 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {revenueGrowthCurrent > 0 ? '+' : ''}
                    {revenueGrowthCurrent}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">YoY</span>
                </div>
                <div className="mt-1 h-1.5 bg-card-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      revenueGrowthCurrent < 0 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(Math.abs(revenueGrowthCurrent) * 2, 100)}%`,
                      marginLeft: revenueGrowthCurrent < 0 ? 'auto' : undefined,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </MetricCard>
      )}

      {/* Valuation Check */}
      {(peRatio !== null || pegRatio !== null) && (
        <MetricCard label="Valuation Check">
          <div className="space-y-3">
            {peRatio !== null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">P/E Ratio</p>
                <Thermometer value={peRatio} max={300} peerAvg={peerPeAvg} />
              </div>
            )}
            {pegRatio !== null && (
              <div className="flex justify-between items-baseline">
                <p className="text-xs text-muted-foreground">PEG Ratio</p>
                <span
                  className={`text-sm font-bold ${
                    pegRatio > 2 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {pegRatio.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </MetricCard>
      )}

      {/* EPS Trend */}
      {epsCurrent !== null && (
        <MetricCard label="EPS Trend">
          <TrendBar current={epsCurrent} previous={epsPrevious} suffix="" />
        </MetricCard>
      )}

      {/* Free Cash Flow */}
      {freeCashFlow && (
        <MetricCard label="The Bright Spot">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-emerald-400">{freeCashFlow}</span>
            <span className="text-xs text-muted-foreground">Free Cash Flow</span>
          </div>
        </MetricCard>
      )}
    </div>
  );
}
