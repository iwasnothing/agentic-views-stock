export type Recommendation = 'Buy' | 'Hold' | 'Sell' | 'Avoid';
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

export interface PersonaAnalysisData {
  persona_name: string;
  executive_summary: ExecutiveSummaryData;
  business_model: string;
  what_they_sell_and_who_buys: string;
  how_they_make_money: string;
  revenue_quality: string;
  cost_structure: string;
  capital_intensity: string;
  growth_drivers: string;
  competitive_edge: string;
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
  businessModel: string;
  whatTheySellAndWhoBuys: string;
  howTheyMakeMoney: string;
  revenueQuality: string;
  costStructure: string;
  capitalIntensity: string;
  growthDrivers: string;
  competitiveEdge: string;
}

export interface ReportData {
  ticker: string;
  recommendation: Recommendation;
  recommendationText: string;
  executiveSummary: string;
  keyTakeaways: string[];
  agreements: string[];
  disagreements: string[];
  analysts: AnalystCard[];
  metrics: FinancialMetrics;
  financialInfo: string;
  consensusScore: number;
}
