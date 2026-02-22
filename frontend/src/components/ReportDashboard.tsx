'use client';

import type { ReportData } from '@/types/report';
import ReactMarkdown from 'react-markdown';
import TickerHead from './TickerHead';
import MetricRail from './MetricRail';
import CompanyProfile from './CompanyProfile';
import AnalystMatrix from './AnalystMatrix';
import SynthesisFooter from './SynthesisFooter';

interface ReportDashboardProps {
  data: ReportData;
}

export default function ReportDashboard({ data }: ReportDashboardProps) {
  return (
    <div className="animate-fade-in-up">
      {/* Ticker Head – sticky top */}
      <TickerHead
        ticker={data.ticker}
        recommendation={data.recommendation}
        consensusScore={data.consensusScore}
        peRatio={data.metrics.peRatio}
      />

      {/* Body: Metric Rail + Analyst Matrix */}
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Left Sidebar – Metric Rail */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0">
          <MetricRail metrics={data.metrics} />
        </aside>

        {/* Main Content – Analyst Matrix */}
        <div className="flex-1 min-w-0">
          {/* Executive Summary */}
          {data.executiveSummary && (
            <div className="mb-4 p-4 bg-card border border-card-border rounded-xl">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Executive Summary
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {data.executiveSummary}
              </p>
              {data.keyTakeaways.length > 0 && (
                <div className="mt-3 pt-3 border-t border-card-border">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                    Key Takeaways
                  </p>
                  <ul className="space-y-1">
                    {data.keyTakeaways.map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400/60 mt-0.5 shrink-0">›</span>
                        <span className="text-xs text-foreground/70 leading-relaxed">
                          <ReactMarkdown>{t}</ReactMarkdown>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Company Profile */}
          <CompanyProfile profile={data.companyProfile} />

          {/* Analyst Matrix */}
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-1">
            Analyst Perspectives
          </h3>
          <AnalystMatrix analysts={data.analysts} />

          {/* Synthesis Footer */}
          <SynthesisFooter
            agreements={data.agreements}
            disagreements={data.disagreements}
          />

          {/* Recommendation Summary */}
          {data.recommendationText && (
            <div className="mt-4 p-4 bg-card border border-card-border rounded-xl">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Recommendation Rationale
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {data.recommendationText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
