'use client';

import { useRef, useEffect } from 'react';
import type { ThinkingStep } from '@/types/report';

interface ThinkingProcessProps {
  steps: ThinkingStep[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isAnalyzing: boolean;
}

const STEP_ICONS: Record<string, string> = {
  start: '🚀',
  planner: '🧠',
  stock_info: '📊',
  generate_personas: '👥',
  analysis: '🔍',
  generate_report: '📝',
};

export default function ThinkingProcess({
  steps,
  isCollapsed,
  onToggleCollapse,
  isAnalyzing,
}: ThinkingProcessProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps, isCollapsed]);

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="mx-auto mt-4 mb-2 flex items-center gap-2 px-4 py-2 bg-card border border-card-border
                   rounded-full text-sm text-muted-foreground hover:text-foreground
                   hover:border-blue-500/30 transition-all cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>
          Completed {steps.filter((s) => s.kind === 'step' && s.status === 'completed').length} analysis steps
        </span>
        <span className="text-green-400">✓</span>
      </button>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 px-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isAnalyzing && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          <h3 className="text-sm font-medium text-muted-foreground">
            {isAnalyzing ? 'Analyzing…' : 'Analysis Complete'}
          </h3>
        </div>
        {!isAnalyzing && (
          <button
            onClick={onToggleCollapse}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Collapse
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="space-y-1 max-h-96 overflow-y-auto pr-2"
      >
        {steps.map((step, idx) => {
          const isStatus = step.kind === 'status';

          return (
            <div
              key={step.id + idx}
              className={`flex items-start gap-3 rounded-lg border animate-fade-in-up ${
                isStatus
                  ? 'py-1.5 px-3 ml-6 bg-card/30 border-card-border/30'
                  : 'py-2 px-3 bg-card/60 border-card-border/50'
              }`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {isStatus ? (
                <span className="text-xs mt-0.5 shrink-0 text-muted-foreground">↳</span>
              ) : (
                <span className="text-base mt-0.5 shrink-0">
                  {STEP_ICONS[step.node] || '⚙️'}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${isStatus ? 'text-xs text-muted-foreground' : 'text-sm text-foreground'}`}>
                  {step.label}
                </p>
                <p className={`truncate ${isStatus ? 'text-[10px] text-muted-foreground/70' : 'text-xs text-muted-foreground'}`}>
                  {step.message}
                </p>
              </div>
              {step.status === 'completed' ? (
                <span className={`text-xs mt-1 shrink-0 ${isStatus ? 'text-green-400/60' : 'text-green-400'}`}>✓</span>
              ) : (
                <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full animate-pulse-dot shrink-0" />
              )}
            </div>
          );
        })}

        {isAnalyzing && (
          <div className="flex items-center gap-3 py-3 px-3">
            <div className="w-4 h-4 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Processing next step…</p>
          </div>
        )}
      </div>
    </div>
  );
}
