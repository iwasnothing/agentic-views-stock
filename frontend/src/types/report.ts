export type Recommendation = 'Buy' | 'Hold' | 'Sell' | 'Avoid';
export type VerdictColor = 'green' | 'yellow' | 'red';
export type Trend = 'up' | 'down' | 'neutral';
export type Severity = 'low' | 'medium' | 'high';

export interface KeyMetric {
  label: string;
  value: string;
  trend: Trend;
  context: string;
}

export interface RiskBadge {
  factor: string;
  severity: Severity;
  description: string;
}

export interface GrowthDriver {
  driver: string;
  impact: Severity;
  description: string;
}

export interface InfographicSummary {
  ticker: string;
  verdict: string;
  verdict_color: VerdictColor;
  one_liner: string;
  key_metrics: KeyMetric[];
  risks: RiskBadge[];
  growth_drivers: GrowthDriver[];
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
  strength_score: number;
  moat_score: number;
  valuation_score: number;
  thesis_points: string[];
}
export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export interface ThinkingStep {
  id: string;
  node: string;
  label: string;
  message: string;
  status: 'active' | 'completed';
  kind: 'step' | 'status';
  timestamp: number;
}

export interface ExecutiveSummaryData {
  profit_outlook: string;
  risk_assessment: string;
  overall_view: string;
}

export interface CompanyProfile {
  business_model: string;
  what_they_sell_and_who_buys: string;
  how_they_make_money: string;
  revenue_quality: string;
  cost_structure: string;
  capital_intensity: string;
  growth_drivers: string;
  competitive_edge: string;
}

export interface PersonaAnalysisData {
  persona_name: string;
  executive_summary: ExecutiveSummaryData;
}

export interface FinancialMetrics {
  peRatio: number | null;
  pegRatio: number | null;
  grossMarginCurrent: number | null;
  grossMarginPrevious: number | null;
  revenueGrowthCurrent: number | null;
  freeCashFlow: string | null;
  epsCurrent: number | null;
  epsPrevious: number | null;
  peerPeAvg: number | null;
}

export interface AnalystCard {
  name: string;
  icon: string;
  archetype: string;
  headline: string;
  keyStat: string;
  keyQuote: string;
  sentiment: Sentiment;
  profitOutlook: string;
  riskAssessment: string;
  overallView: string;
}

export interface ReportData {
  ticker: string;
  recommendation: Recommendation;
  recommendationText: string;
  executiveSummary: string;
  keyTakeaways: string[];
  agreements: string[];
  disagreements: string[];
  companyProfile: CompanyProfile;
  analysts: AnalystCard[];
  metrics: FinancialMetrics;
  financialInfo: string;
  consensusScore: number;
}
