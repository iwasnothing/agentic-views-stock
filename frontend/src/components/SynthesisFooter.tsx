'use client';

interface SynthesisFooterProps {
  agreements: string[];
  disagreements: string[];
}

export default function SynthesisFooter({
  agreements,
  disagreements,
}: SynthesisFooterProps) {
  if (!agreements.length && !disagreements.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
      {/* The Agreement */}
      {agreements.length > 0 && (
        <div className="p-4 bg-card border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-emerald-400">✅</span>
            <h4 className="text-sm font-semibold text-emerald-400">The Agreement</h4>
          </div>
          <ul className="space-y-2">
            {agreements.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500/60 mt-0.5 shrink-0">•</span>
                <span className="text-xs text-foreground/80 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The Conflict */}
      {disagreements.length > 0 && (
        <div className="p-4 bg-card border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400">⚡</span>
            <h4 className="text-sm font-semibold text-amber-400">The Debate</h4>
          </div>
          <ul className="space-y-2">
            {disagreements.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500/60 mt-0.5 shrink-0">•</span>
                <span className="text-xs text-foreground/80 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
