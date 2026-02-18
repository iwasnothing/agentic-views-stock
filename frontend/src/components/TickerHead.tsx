'use client';

import type { Recommendation } from '@/types/report';

interface TickerHeadProps {
  ticker: string;
  recommendation: Recommendation;
  consensusScore: number;
  peRatio: number | null;
}

const REC_COLORS: Record<Recommendation, string> = {
  Buy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Hold: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Sell: 'bg-red-500/20 text-red-400 border-red-500/30',
  Avoid: 'bg-red-600/20 text-red-500 border-red-600/30',
};

export default function TickerHead({
  ticker,
  recommendation,
  consensusScore,
  peRatio,
}: TickerHeadProps) {
  const meterPosition = ((consensusScore + 1) / 2) * 100;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 p-4 md:p-5 bg-card border-b border-card-border">
      {/* Ticker + Recommendation */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {ticker}
        </span>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-md border ${REC_COLORS[recommendation]}`}
        >
          {recommendation.toUpperCase()}
        </span>
      </div>

      {/* Consensus Meter */}
      <div className="flex-1 min-w-0 w-full md:w-auto">
        <p className="text-xs text-muted-foreground mb-1.5 font-medium">Consensus Meter</p>
        <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-red-500/30 via-amber-500/30 to-emerald-500/30">
          <div
            className="absolute top-0 w-3 h-3 rounded-full bg-white shadow-lg shadow-white/30
                       transform -translate-x-1/2 transition-all duration-700"
            style={{ left: `${meterPosition}%` }}
          />
          <div className="absolute inset-0 flex justify-between px-1 items-center">
            <span className="text-[9px] text-red-400/80 font-medium">Bearish</span>
            <span className="text-[9px] text-amber-400/80 font-medium">Neutral</span>
            <span className="text-[9px] text-emerald-400/80 font-medium">Bullish</span>
          </div>
        </div>
      </div>

      {/* Key Alert */}
      {peRatio !== null && peRatio > 50 && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-amber-400">⚠️</span>
          <span className="text-xs text-amber-300 font-medium">
            High Valuation: P/E {peRatio.toFixed(1)}x
          </span>
        </div>
      )}
    </div>
  );
}
