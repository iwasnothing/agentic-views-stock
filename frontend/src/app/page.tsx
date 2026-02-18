'use client';

import { useState, useRef, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import ThinkingProcess from '@/components/ThinkingProcess';
import ReportDashboard from '@/components/ReportDashboard';
import { parseReport } from '@/lib/parseReport';
import type { ThinkingStep, ReportData, PersonaAnalysisData } from '@/types/report';

type AppPhase = 'idle' | 'analyzing' | 'done' | 'error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('idle');
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);
  const [currentTicker, setCurrentTicker] = useState('');

  const streamState = useRef({
    ticker: '',
    financialInfo: '',
    personaAnalyses: [] as PersonaAnalysisData[],
    report: '',
  });

  const handleSubmit = useCallback(async (ticker: string) => {
    setPhase('analyzing');
    setSteps([]);
    setReportData(null);
    setError(null);
    setIsThinkingCollapsed(false);
    setCurrentTicker(ticker);
    streamState.current = {
      ticker: '',
      financialInfo: '',
      personaAnalyses: [],
      report: '',
    };

    try {
      const response = await fetch(`${API_URL}/api/analyze/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_message: `Analyze ${ticker} stock` }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;

          let data: Record<string, unknown>;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (data.type === 'start') {
            setSteps((prev) => [
              ...prev,
              {
                id: 'start',
                node: 'start',
                label: 'Pipeline Started',
                message: data.message as string,
                status: 'completed',
                kind: 'step',
                timestamp: Date.now(),
              },
            ]);
          } else if (data.type === 'status') {
            setSteps((prev) => [
              ...prev,
              {
                id: `status-${Date.now()}-${Math.random()}`,
                node: (data.node as string) || '',
                label: (data.label as string) || '',
                message: (data.message as string) || '',
                status: 'completed',
                kind: 'status',
                timestamp: Date.now(),
              },
            ]);
          } else if (data.type === 'step') {
            setSteps((prev) => [
              ...prev,
              {
                id: data.node as string,
                node: data.node as string,
                label: (data.label as string) || (data.node as string),
                message: (data.message as string) || '',
                status: 'completed',
                kind: 'step',
                timestamp: Date.now(),
              },
            ]);

            if (data.ticker) streamState.current.ticker = data.ticker as string;
            if (data.financial_info)
              streamState.current.financialInfo = data.financial_info as string;
            if (data.persona_analyses)
              streamState.current.personaAnalyses =
                data.persona_analyses as PersonaAnalysisData[];
            if (data.report) streamState.current.report = data.report as string;
          } else if (data.type === 'complete') {
            const { ticker: t, financialInfo, personaAnalyses, report } =
              streamState.current;
            const parsed = parseReport(
              t || ticker,
              report,
              financialInfo,
              personaAnalyses,
            );
            setReportData(parsed);
            setPhase('done');
            setIsThinkingCollapsed(true);
          } else if (data.type === 'error') {
            setError(data.message as string);
            setPhase('error');
          }
        }
      }

      // If we reached the end without a 'complete' event, try to build from whatever we have
      if (streamState.current.report && !reportData) {
        const { ticker: t, financialInfo, personaAnalyses, report } =
          streamState.current;
        const parsed = parseReport(
          t || ticker,
          report,
          financialInfo,
          personaAnalyses,
        );
        setReportData(parsed);
        setPhase('done');
        setIsThinkingCollapsed(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection failed';
      setError(msg);
      setPhase('error');
    }
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {phase === 'idle' ? (
        /* ────── Centered Search Page ────── */
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
              Stock Analyst
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              AI-powered multi-perspective investment analysis
            </p>
          </div>
          <SearchBar onSubmit={handleSubmit} isCompact={false} disabled={false} />
          <p className="mt-12 text-xs text-muted-foreground/50 max-w-md text-center">
            Powered by LangGraph agents — generates analysis from 4 distinct
            analyst personas with real-time financial data.
          </p>
        </div>
      ) : (
        /* ────── Analysis / Report View ────── */
        <div className="flex flex-col min-h-screen">
          {/* Compact top bar */}
          <div className="border-b border-card-border bg-card/50 backdrop-blur-sm px-4 py-3 sticky top-0 z-30">
            <SearchBar
              onSubmit={handleSubmit}
              isCompact={true}
              disabled={phase === 'analyzing'}
              initialValue={currentTicker}
            />
          </div>

          <div className="flex-1 overflow-auto">
            {/* Error banner */}
            {error && (
              <div className="mx-auto max-w-2xl mt-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={() => {
                    setPhase('idle');
                    setError(null);
                  }}
                  className="mt-2 text-xs text-red-400/70 underline hover:text-red-300"
                >
                  Start over
                </button>
              </div>
            )}

            {/* Thinking Process */}
            {steps.length > 0 && (
              <ThinkingProcess
                steps={steps}
                isCollapsed={isThinkingCollapsed}
                onToggleCollapse={() => setIsThinkingCollapsed((p) => !p)}
                isAnalyzing={phase === 'analyzing'}
              />
            )}

            {/* Report Dashboard */}
            {reportData && <ReportDashboard data={reportData} />}
          </div>
        </div>
      )}
    </main>
  );
}
