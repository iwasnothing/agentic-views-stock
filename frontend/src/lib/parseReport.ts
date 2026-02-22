import type {
  ReportData,
  Recommendation,
  Sentiment,
  AnalystCard,
  FinancialMetrics,
  PersonaAnalysisData,
  CompanyProfile,
} from '@/types/report';

const ANALYST_ICONS = ['📊', '🔍', '🌐', '📈'];
const ANALYST_ARCHETYPES = [
  'Value Analyst',
  'Growth Analyst',
  'Macro Strategist',
  'Quantitative Analyst',
];

function extractRecommendation(report: string): Recommendation {
  const pattern = /\*\*(Buy|Hold|Sell|Avoid)\*\*/i;
  const match = report.match(pattern);
  if (match) {
    const raw = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    if (['Buy', 'Hold', 'Sell', 'Avoid'].includes(raw)) return raw as Recommendation;
  }
  return 'Hold';
}

function extractRecommendationText(report: string): string {
  const recSection = report.match(
    /##\s*1\.\s*Recommendation\s*\n([\s\S]*?)(?=\n##\s|\n---|\n$)/i,
  );
  if (recSection) {
    return recSection[1]
      .replace(/\*\*(Buy|Hold|Sell|Avoid)\*\*/gi, '')
      .replace(/^\s*[-*]\s*/gm, '')
      .trim()
      .split('\n')
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function extractExecutiveSummary(report: string): { summary: string; takeaways: string[] } {
  const section = report.match(
    /##\s*2\.\s*Executive Summary\s*\n([\s\S]*?)(?=\n##\s|\n$)/i,
  );
  if (!section) return { summary: '', takeaways: [] };

  const text = section[1].trim();
  const lines = text.split('\n');
  const paragraphs: string[] = [];
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*•]\s+/.test(trimmed)) {
      bullets.push(trimmed.replace(/^[-*•]\s+/, ''));
    } else if (trimmed) {
      paragraphs.push(trimmed);
    }
  }

  return {
    summary: paragraphs.join(' '),
    takeaways: bullets,
  };
}

function extractCompanyProfile(report: string): CompanyProfile {
  const section = report.match(
    /##\s*3\.\s*Company Profile\s*\n([\s\S]*?)(?=\n##\s|\n$)/i,
  );

  const defaults: CompanyProfile = {
    business_model: '',
    what_they_sell_and_who_buys: '',
    how_they_make_money: '',
    revenue_quality: '',
    cost_structure: '',
    capital_intensity: '',
    growth_drivers: '',
    competitive_edge: '',
  };

  if (!section) return defaults;

  const text = section[1].trim();
  const profile: CompanyProfile = { ...defaults };

  // Extract each section - capture everything up to the next bold heading
  const sections = [
    { key: 'business_model' as const, pattern: /\*\*Business Model\*\*:\s*([\s\S]*?)(?=\n\*\*)/i },
    { key: 'what_they_sell_and_who_buys' as const, pattern: /\*\*Products & Customers\*\*:\s*([\s\S]*?)(?=\n\*\*)/i },
    { key: 'how_they_make_money' as const, pattern: /\*\*Revenue Model\*\*:\s*([\s\S]*?)(?=\n\*\*)/i },
    { key: 'revenue_quality' as const, pattern: /\*\*Revenue Quality\*\*:\s*([\s\S]*?)(?=\n\*\*)/i },
    { key: 'cost_structure' as const, pattern: /\*\*Cost Structure\*\*:\s*([\s\S]*?)(?=\n\*\*)/i },
    { key: 'capital_intensity' as const, pattern: /\*\*Capital Intensity\*\*:\s*([\s\S]*?)(?=\n\*\*)/i },
    { key: 'growth_drivers' as const, pattern: /\*\*Growth Drivers\*\*:\s*([\s\S]*?)(?=\n\*\*)/i },
    { key: 'competitive_edge' as const, pattern: /\*\*Competitive Edge\*\*:\s*([\s\S]*?)(?=\n\*\*|\n$)/i },
  ];

  for (const { key, pattern } of sections) {
    const match = text.match(pattern);
    if (match) {
      profile[key] = match[1].trim();
    }
  }

  return profile;
}

function determineSentiment(overallView: string): Sentiment {
  const lower = overallView.toLowerCase();
  if (/\bbullish\b/.test(lower) || /\bbuy\b/.test(lower) || /\boptimistic\b/.test(lower)) {
    return 'bullish';
  }
  if (/\bbearish\b/.test(lower) || /\bsell\b/.test(lower) || /\bavoid\b/.test(lower) || /\bpessimistic\b/.test(lower)) {
    return 'bearish';
  }
  return 'neutral';
}

function extractFirstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/);
  return match ? match[0].trim() : text.slice(0, 120);
}

function buildAnalystCards(personaAnalyses: PersonaAnalysisData[]): AnalystCard[] {
  return personaAnalyses.map((pa, i) => {
    const sentiment = determineSentiment(pa.executive_summary.overall_view);
    return {
      name: pa.persona_name,
      icon: ANALYST_ICONS[i % ANALYST_ICONS.length],
      archetype: ANALYST_ARCHETYPES[i % ANALYST_ARCHETYPES.length],
      headline: extractFirstSentence(pa.executive_summary.overall_view),
      keyStat: extractFirstSentence(pa.executive_summary.profit_outlook),
      keyQuote: extractFirstSentence(pa.executive_summary.risk_assessment),
      sentiment,
      profitOutlook: pa.executive_summary.profit_outlook,
      riskAssessment: pa.executive_summary.risk_assessment,
      overallView: pa.executive_summary.overall_view,
    };
  });
}

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === 'N/A' || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function extractMetrics(financialInfo: string): FinancialMetrics {
  const defaults: FinancialMetrics = {
    peRatio: null,
    pegRatio: null,
    grossMarginCurrent: null,
    grossMarginPrevious: null,
    revenueGrowthCurrent: null,
    freeCashFlow: null,
    epsCurrent: null,
    epsPrevious: null,
    peerPeAvg: null,
  };

  const infoMatch = financialInfo.match(/### yfinance Company Info\s*\n([\s\S]*?)(?=\n###|\n##|$)/);
  if (!infoMatch) return defaults;

  try {
    const info = JSON.parse(infoMatch[1].trim());
    return {
      peRatio: parseNumber(info.trailingPE),
      pegRatio: null,
      grossMarginCurrent: null,
      grossMarginPrevious: null,
      revenueGrowthCurrent: null,
      freeCashFlow: info.freeCashflow != null ? String(info.freeCashflow) : null,
      epsCurrent: parseNumber(info.trailingEps),
      epsPrevious: parseNumber(info.forwardEps),
      peerPeAvg: parseNumber(info.forwardPE),
    };
  } catch {
    return defaults;
  }
}

function computeConsensus(analysts: AnalystCard[]): number {
  if (analysts.length === 0) return 50;
  const scores = analysts.map((a) => {
    if (a.sentiment === 'bullish') return 80;
    if (a.sentiment === 'bearish') return 20;
    return 50;
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function findAgreements(analysts: AnalystCard[]): string[] {
  if (analysts.length < 2) return [];
  const sentiments = new Set(analysts.map((a) => a.sentiment));
  const agreements: string[] = [];
  if (sentiments.size === 1) {
    agreements.push(`All analysts share a ${analysts[0].sentiment} outlook`);
  }
  const allMentionGrowth = analysts.every((a) => /growth/i.test(a.profitOutlook));
  if (allMentionGrowth) {
    agreements.push('All analysts identify growth as a key factor');
  }
  const allMentionRisk = analysts.every((a) => a.riskAssessment.length > 20);
  if (allMentionRisk && agreements.length === 0) {
    agreements.push('All analysts provide substantive risk assessments');
  }
  return agreements;
}

function findDisagreements(analysts: AnalystCard[]): string[] {
  if (analysts.length < 2) return [];
  const sentiments = new Set(analysts.map((a) => a.sentiment));
  const disagreements: string[] = [];
  if (sentiments.size > 1) {
    const bulls = analysts.filter((a) => a.sentiment === 'bullish').map((a) => a.name);
    const bears = analysts.filter((a) => a.sentiment === 'bearish').map((a) => a.name);
    if (bulls.length > 0 && bears.length > 0) {
      disagreements.push(
        `${bulls.join(', ')} ${bulls.length === 1 ? 'is' : 'are'} bullish while ${bears.join(', ')} ${bears.length === 1 ? 'is' : 'are'} bearish`,
      );
    }
  }
  return disagreements;
}

export function parseReport(
  ticker: string,
  report: string,
  financialInfo: string,
  personaAnalyses: PersonaAnalysisData[],
  structuredCompanyProfile?: CompanyProfile | null,
): ReportData {
  const recommendation = extractRecommendation(report);
  const recommendationText = extractRecommendationText(report);
  const { summary, takeaways } = extractExecutiveSummary(report);
  const companyProfile = structuredCompanyProfile ?? extractCompanyProfile(report);
  const analysts = buildAnalystCards(personaAnalyses);
  const metrics = extractMetrics(financialInfo);
  const consensusScore = computeConsensus(analysts);
  const agreements = findAgreements(analysts);
  const disagreements = findDisagreements(analysts);

  return {
    ticker,
    recommendation,
    recommendationText,
    executiveSummary: summary,
    keyTakeaways: takeaways,
    companyProfile,
    agreements,
    disagreements,
    analysts,
    metrics,
    financialInfo,
    consensusScore,
  };
}
