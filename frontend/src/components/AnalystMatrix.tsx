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

const DETAIL_SECTIONS: { key: keyof AnalystCard; label: string }[] = [
  { key: 'businessModel', label: 'Business Model' },
  { key: 'whatTheySellAndWhoBuys', label: 'Products & Customers' },
  { key: 'howTheyMakeMoney', label: 'Revenue Model' },
  { key: 'revenueQuality', label: 'Revenue Quality' },
  { key: 'costStructure', label: 'Cost Structure' },
  { key: 'capitalIntensity', label: 'Capital Intensity' },
  { key: 'growthDrivers', label: 'Growth Drivers' },
  { key: 'competitiveEdge', label: 'Competitive Edge' },
];

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function DetailSection({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
        {label}
      </p>
      <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
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
                  hover:bg-card-hover ${SENTIMENT_BORDER[analyst.sentiment]}
                  ${isExpanded ? 'md:col-span-2' : ''}`}
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

      {/* Collapsed: show truncated overall view */}
      {!isExpanded && (
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
            Overall View
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {truncate(analyst.overallView, 200)}
          </p>
        </div>
      )}

      {/* Expanded: show executive summary + all detail sections */}
      {isExpanded && (
        <div className="space-y-4 mt-3 animate-fade-in-up">
          {/* Executive Summary trio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-background/40 rounded-lg border border-card-border/50">
              <p className="text-[10px] uppercase tracking-wide text-emerald-400/80 font-semibold mb-1">
                Profit Outlook
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {analyst.profitOutlook}
              </p>
            </div>
            <div className="p-3 bg-background/40 rounded-lg border border-card-border/50">
              <p className="text-[10px] uppercase tracking-wide text-amber-400/80 font-semibold mb-1">
                Risk Assessment
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {analyst.riskAssessment}
              </p>
            </div>
            <div className="p-3 bg-background/40 rounded-lg border border-card-border/50">
              <p className="text-[10px] uppercase tracking-wide text-blue-400/80 font-semibold mb-1">
                Overall Verdict
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {analyst.overallView}
              </p>
            </div>
          </div>

          {/* Detailed analysis sections */}
          <div className="border-t border-card-border/50 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              Detailed Analysis
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DETAIL_SECTIONS.map(({ key, label }) => (
                <DetailSection
                  key={key}
                  label={label}
                  text={analyst[key] as string}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expand Hint */}
      <div className="flex items-center justify-center gap-1 mt-3">
        <span className="text-[10px] text-muted-foreground">
          {isExpanded ? 'Show less' : 'Show full analysis'}
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
      {/* 2x2 Grid — expanded card spans full width */}
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
