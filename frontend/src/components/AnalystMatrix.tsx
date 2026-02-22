'use client';

import { useState } from 'react';
import type { AnalystCard, Sentiment } from '@/types/report';

interface AnalystMatrixProps {
  analysts: AnalystCard[];
}

const SENTIMENT_BORDER: Record<Sentiment, string> = {
  bullish: 'border-emerald-500/30 hover:border-emerald-500/50',
  bearish: 'border-red-500/30 hover:border-red-500/50',
  neutral: 'border-amber-500/30 hover:border-amber-500/50',
};

const SENTIMENT_TAG: Record<Sentiment, { bg: string; text: string; label: string }> = {
  bullish: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Bullish' },
  bearish: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Bearish' },
  neutral: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Neutral' },
};

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function AnalystCardView({
  analyst,
  isExpanded,
  onToggle,
}: {
  analyst: AnalystCard;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const tag = SENTIMENT_TAG[analyst.sentiment];

  return (
    <div
      className={`p-4 bg-card border rounded-xl transition-all cursor-pointer
                  hover:bg-card-hover ${SENTIMENT_BORDER[analyst.sentiment]}`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{analyst.icon}</span>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {analyst.name}
            </p>
            <p className="text-[10px] text-muted-foreground">{analyst.archetype}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${tag.bg} ${tag.text}`}>
          {tag.label}
        </span>
      </div>

      {/* Headline */}
      <p className="text-sm font-medium text-foreground mb-2">
        &ldquo;{analyst.headline}&rdquo;
      </p>

      {/* Key Stat */}
      <div className="mb-3 px-2 py-1.5 bg-background/50 rounded-md">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
          Key Stat
        </p>
        <p className="text-xs text-foreground font-medium leading-snug">
          {analyst.keyStat}
        </p>
      </div>

      {/* Executive Summary trio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in-up">
        <div className="p-3 bg-background/40 rounded-lg border border-card-border/50">
          <p className="text-[10px] uppercase tracking-wide text-emerald-400/80 font-semibold mb-1">
            Profit Outlook
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {truncate(analyst.profitOutlook, isExpanded ? 500 : 200)}
          </p>
        </div>
        <div className="p-3 bg-background/40 rounded-lg border border-card-border/50">
          <p className="text-[10px] uppercase tracking-wide text-amber-400/80 font-semibold mb-1">
            Risk Assessment
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {truncate(analyst.riskAssessment, isExpanded ? 500 : 200)}
          </p>
        </div>
        <div className="p-3 bg-background/40 rounded-lg border border-card-border/50">
          <p className="text-[10px] uppercase tracking-wide text-blue-400/80 font-semibold mb-1">
            Overall Verdict
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {truncate(analyst.overallView, isExpanded ? 500 : 200)}
          </p>
        </div>
      </div>

      {/* Expand Hint */}
      <div className="flex items-center justify-center gap-1 mt-3">
        <span className="text-[10px] text-muted-foreground">
          {isExpanded ? 'Show less' : 'Show more'}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export default function AnalystMatrix({ analysts }: AnalystMatrixProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div>
      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {analysts.map((analyst, idx) => (
          <AnalystCardView
            key={analyst.name}
            analyst={analyst}
            isExpanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          />
        ))}
      </div>
    </div>
  );
}
