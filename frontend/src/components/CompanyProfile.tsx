'use client';

import type { CompanyProfile } from '@/types/report';

interface CompanyProfileProps {
  profile: CompanyProfile;
}

const PROFILE_SECTIONS: { key: keyof CompanyProfile; label: string; color: string }[] = [
  { key: 'business_model', label: 'Business Model', color: 'text-emerald-400/80' },
  { key: 'what_they_sell_and_who_buys', label: 'Products & Customers', color: 'text-blue-400/80' },
  { key: 'how_they_make_money', label: 'Revenue Model', color: 'text-purple-400/80' },
  { key: 'revenue_quality', label: 'Revenue Quality', color: 'text-amber-400/80' },
  { key: 'cost_structure', label: 'Cost Structure', color: 'text-orange-400/80' },
  { key: 'capital_intensity', label: 'Capital Intensity', color: 'text-pink-400/80' },
  { key: 'growth_drivers', label: 'Growth Drivers', color: 'text-cyan-400/80' },
  { key: 'competitive_edge', label: 'Competitive Edge', color: 'text-indigo-400/80' },
];

export default function CompanyProfileSection({ profile }: CompanyProfileProps) {
  return (
    <div className="mb-4 p-4 bg-card border border-card-border rounded-xl">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Company Profile
      </h3>

      <div className="space-y-4">
        {PROFILE_SECTIONS.map(({ key, label, color }) => {
          const text = profile[key];
          if (!text) return null;

          return (
            <div key={key} className="border-b border-card-border/50 pb-3 last:border-0 last:pb-0">
              <p className={`text-[10px] uppercase tracking-wide ${color} font-semibold mb-1`}>
                {label}
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
