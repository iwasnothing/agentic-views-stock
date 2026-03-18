'use client';

import type { InfographicSummary, CompanyProfile, AnalystCard } from '@/types/report';
import React from 'react';

interface InfographicProps {
  summary: InfographicSummary;
  companyProfile: CompanyProfile;
  analysts: AnalystCard[];
}

// Color constants
const COLORS = {
  bg: '#080B14',
  bullish: '#00FFA3',
  bearish: '#FF4757',
  brand: '#00D4FF',
  white: '#FFFFFF',
  slate: '#94A3B8',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

// Reusable GlassCard component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`
        ${className}
        backdrop-blur-lg
        bg-white/[0.05]
        border border-white/[0.10]
        rounded-2xl
        shadow-2xl
      `}
    >
      {children}
    </div>
  );
}

// Icons as SVG components
const Icons = {
  check: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.bullish} strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  cross: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.bearish} strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  alert: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.bearish} strokeWidth="2.5">
      <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trendUp: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.bullish} strokeWidth="2">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  ),
  trendDown: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.bearish} strokeWidth="2">
      <path d="M23 18l-9.5-9.5-5 5L1 6" />
      <path d="M17 18h6v-6" />
    </svg>
  ),
  building: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
      <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21V9M12 9v12M16 21V9" />
    </svg>
  ),
  money: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6M12 5v3M12 16v3" />
    </svg>
  ),
  chart: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  shield: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  rocket: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2M9 6c0-1.5 1.5-3 3-3s3 1.5 3 3m3.5 10.5c1.5 1.26 2 5 2 5s-3.74-.5-5-2" />
      <path d="M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  users: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  warning: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.bearish} strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
    </svg>
  ),
};

// Header Component
function Header({ summary }: { summary: InfographicSummary }) {
  const verdictColor = summary.verdict_color === 'green' ? COLORS.bullish :
                    summary.verdict_color === 'red' ? COLORS.bearish : '#FFA500';

  const totalAnalysts = summary.bullish_count + summary.bearish_count + summary.neutral_count;
  const bullishPct = totalAnalysts > 0 ? (summary.bullish_count / totalAnalysts) * 100 : 0;
  const meterPosition = bullishPct;

  return (
    <GlassCard className="w-full p-6 mb-6">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Logo & Ticker */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{summary.ticker}</h1>
            <p className="text-slate-400 text-sm">Investment Analysis</p>
          </div>
        </div>

        {/* Verdict Badge */}
        <div
          className="px-6 py-3 rounded-xl font-bold text-lg text-center"
          style={{
            backgroundColor: `${verdictColor}20`,
            color: verdictColor,
            border: `1px solid ${verdictColor}40`,
            boxShadow: `0 0 30px ${verdictColor}30`,
          }}
        >
          {summary.verdict.toUpperCase()}
        </div>

        {/* Consensus Meter */}
        <div className="flex-1 max-w-md">
          <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">Analyst Consensus</p>
          <div className="relative h-3 rounded-full bg-gradient-to-r from-red-500/50 via-amber-500/50 to-emerald-500/50">
            <div
              className="absolute top-0 w-4 h-4 rounded-full bg-white shadow-lg"
              style={{ left: `calc(${meterPosition}% - 8px)`, boxShadow: '0 0 20px rgba(255,255,255,0.5)' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-red-400 font-medium">{summary.bearish_count} Bear</span>
            <span className="text-amber-400 font-medium">{summary.neutral_count} Neutral</span>
            <span className="text-emerald-400 font-medium">{summary.bullish_count} Bull</span>
          </div>
        </div>
      </div>

      {/* One-liner */}
      <p className="mt-4 text-white/80 text-center lg:text-left text-sm leading-relaxed">
        {summary.one_liner}
      </p>
    </GlassCard>
  );
}

// Key Metrics Component
function KeyMetrics({ summary }: { summary: InfographicSummary }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <Icons.chart />
        <h2 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">Key Metrics</h2>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {summary.key_metrics.map((metric, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
            <span className="text-slate-400 text-sm">{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{metric.value}</span>
              {metric.trend === 'up' ? <Icons.trendUp /> :
               metric.trend === 'down' ? <Icons.trendDown /> : null}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// Executive Summary Component
function ExecutiveSummary({ summary }: { summary: InfographicSummary }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <Icons.building />
        <h2 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">At A Glance</h2>
      </div>
      <div className="space-y-3">
        {/* Strength Score */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Strength</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${(summary.strength_score / 10) * 100}%` }}
              />
            </div>
            <span className="text-white font-bold text-sm">{summary.strength_score}/10</span>
          </div>
        </div>
        {/* Moat Score */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Moat</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${(summary.moat_score / 10) * 100}%` }}
              />
            </div>
            <span className="text-white font-bold text-sm">{summary.moat_score}/10</span>
          </div>
        </div>
        {/* Valuation Score */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Valuation</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500"
                style={{ width: `${(summary.valuation_score / 10) * 100}%` }}
              />
            </div>
            <span className="text-white font-bold text-sm">{summary.valuation_score}/10</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// Info List Card Component
function InfoListCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: { text: string; type?: 'pos' | 'neg' | 'neutral' }[];
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            {item.type === 'pos' ? <Icons.check /> :
             item.type === 'neg' ? <Icons.cross /> :
             <span className="w-5 h-5 text-slate-400">•</span>}
            <span className="text-white/80 text-sm leading-relaxed">{item.text}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

// Analyst Perspectives Component
function AnalystPerspectives({ analysts }: { analysts: AnalystCard[] }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <Icons.users />
        <h2 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">Analyst Views</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {analysts.map((analyst, i) => {
          const stanceColor = analyst.sentiment === 'bullish' ? COLORS.bullish :
                           analyst.sentiment === 'bearish' ? COLORS.bearish : '#FFA500';

          return (
            <div key={i} className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-2 text-2xl"
                style={{
                  border: `2px solid ${stanceColor}50`,
                  backgroundColor: `${stanceColor}15`,
                }}
              >
                {analyst.icon}
              </div>
              <h3 className="text-white font-semibold text-sm">{analyst.name}</h3>
              <span
                className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full"
                style={{
                  color: stanceColor,
                  backgroundColor: `${stanceColor}20`,
                  border: `1px solid ${stanceColor}40`,
                }}
              >
                {analyst.sentiment.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

export default function Infographic({ summary, companyProfile, analysts }: InfographicProps) {
  // Transform data for info lists
  const riskItems = summary.risks.map(r => ({
    text: r.description,
    type: 'neg' as const,
  }));

  const growthItems = summary.growth_drivers.map(g => ({
    text: g.description,
    type: 'pos' as const,
  }));

  const thesisItems = summary.thesis_points.map(p => ({
    text: p,
    type: 'neutral' as const,
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <Header summary={summary} />

      {/* Three-Column Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Left Column */}
        <div className="space-y-4">
          <KeyMetrics summary={summary} />
          <ExecutiveSummary summary={summary} />
        </div>

        {/* Middle Column */}
        <div className="space-y-4">
          <InfoListCard
            icon={<Icons.building />}
            title="Growth Drivers"
            items={growthItems}
          />
          <InfoListCard
            icon={<Icons.warning />}
            title="Risks"
            items={riskItems}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <InfoListCard
            icon={<Icons.money />}
            title="Revenue Model"
            items={[{ text: companyProfile.how_they_make_money, type: 'neutral' }]}
          />
          <InfoListCard
            icon={<Icons.shield />}
            title="Competitive Edge"
            items={[{ text: companyProfile.competitive_edge, type: 'neutral' }]}
          />
        </div>
      </div>

      {/* Bottom Span */}
      <div className="space-y-4">
        <AnalystPerspectives analysts={analysts} />
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Icons.rocket />
            <h2 className="text-cyan-400 font-bold text-sm uppercase tracking-wider">Investment Thesis</h2>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {thesisItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.03]">
                <span className="text-cyan-400 mt-1">{i + 1}</span>
                <span className="text-white/80 text-sm leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
