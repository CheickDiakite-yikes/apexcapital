

export enum AnalysisStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  MODELING = 'MODELING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface StationQuota {
  searchCount: number;
  lastResetMonth: string; // YYYY-MM
  stationId: string;
}

export interface FinancialRow {
  metric: string;
  historical: number[]; // Last 3 years
  projected: number[];  // Next 3 years
  unit: string;
}

export interface Statement {
  title: string;
  rows: FinancialRow[];
}

export interface Ratio {
  name: string;
  value: string | number;
  unit?: string;
}

export interface FinancialRatios {
  profitability: Ratio[];
  liquidity: Ratio[];
  solvency: Ratio[];
  efficiency: Ratio[];
}

export interface DCFModel {
  wacc: number;
  terminalGrowthRate: number;
  enterpriseValue: number;
  equityValue: number;
  sharePriceTarget: number;
  upsideDownside: number;
  fcfProjections: number[];
}

export interface LBOModel {
  entryMultiple: number;
  exitMultiple: number;
  debtAmount: number;
  irr: number;
  moc: number; // Multiple of Capital
}

export interface Catalyst {
  event: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timing: string; // e.g., "Q3 2024"
  description: string;
}

export interface InvestmentThesis {
  rating: 'BUY' | 'SELL' | 'HOLD';
  conviction: number; // 0-100
  targetPriceBase: number;
  targetPriceBull: number;
  targetPriceBear: number;
  theBet: string; // The core narrative/wager
  catalysts: Catalyst[];
  moatScore: number; // 1-5
  moatSource: string; // e.g., "Network Effects"
  managementScore: number; // 1-5
  managementNotes: string;
  bullCase: string[];
  bearCase: string[];
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  timestamp: string; // "2m ago", "1h ago"
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  type: 'M&A' | 'EARNINGS' | 'MACRO' | 'RUMOR';
}

export interface SupplyChain {
  suppliers: string[];
  customers: string[];
  risks: string;
}

export interface EarningsQuality {
  score: number; // 1-100
  redFlags: string[];
  accountingNotes: string;
}

export interface InsiderTransaction {
  name: string;
  role: string;
  type: 'BUY' | 'SELL';
  amount: string;
  date: string;
}

export interface AIRiskAnalysis {
  riskScore: number; // 0-100, higher is riskier
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  replacementProbability: number; // 0-100% chance of core business being replaced by AI
  innovationLag: 'LEADER' | 'PARITY' | 'LAGGARD';
  vibecodeSensitivity: number; // 0-100 score of "Vibecode" risk (cultural/tech obsolescence)
  summary: string;
  threats: string[];
  mitigants: string[];
}

export interface PrecedentTransaction {
  date: string;
  target: string;
  acquirer: string;
  dealSize: number; // in Millions
  evEbitda: number;
  premium: number; // %
}

export interface CompanyProfile {
  name: string;
  ticker: string;
  sector: string;
  price: number;
  marketCap: string;
  summary: string;
  risks: string[];
  strengths: string[];
}

export interface ResearchMemo {
  headline: string;
  executiveSummary: string;
  keyDrivers: string[];
  valuationThesis: string;
  macroOutlook: string;
  imagePrompt: string; // Prompt for image generation
}

export interface QuarterlySentiment {
  quarter: string; // e.g. "Q3 23"
  sentimentScore: number; // 0-100
  hesitationWords: number; // Count of words like "challenge", "uncertain"
  confidenceWords: number; // Count of words like "strong", "robust"
  keyPhraseShift: string; // e.g. "From 'Strong Demand' to 'Cautious Outlook'"
}

export interface AlternativeData {
  webTrafficTrend: number; // % change YoY
  appDownloadTrend: number; // % change YoY
  searchVolumeTrend: number; // % change YoY
  verdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  insight: string;
}

export interface InstitutionalHolder {
  name: string;
  shares: string;
  change: number; // % change in position
  date: string;
}

export interface InstitutionalOwnership {
  totalOwnership: number; // %
  crowdednessScore: number; // 0-100 (Higher is more crowded)
  topHolders: InstitutionalHolder[];
  smartMoneyFlow: 'INFLOW' | 'OUTFLOW' | 'NEUTRAL';
}

export interface HedgeFundAlpha {
  earningsSentiment: QuarterlySentiment[];
  alternativeData: AlternativeData;
  institutionalOwnership: InstitutionalOwnership;
}

export interface AgentLog {
  id: string;
  agent: 'SCOUT' | 'ANALYST' | 'ASSOCIATE' | 'VP' | 'PM';
  message: string;
  timestamp: number;
}

export interface ChatMessage {
  role: 'USER' | 'AI';
  content: string;
  timestamp: number;
}

export interface ValuationComp {
  ticker: string;
  evEbitda: number;
  evSales: number;
  pe: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  netDebtEbitda: number;
  ruleOf40: number; // Revenue Growth + EBITDA Margin
}

export interface FullAnalysis {
  profile: CompanyProfile;
  thesis: InvestmentThesis;
  incomeStatement: Statement;
  balanceSheet: Statement;
  cashFlowStatement: Statement;
  financialRatios: FinancialRatios;
  dcf: DCFModel;
  lbo: LBOModel;
  valuationComps: ValuationComp[];
  precedentTransactions: PrecedentTransaction[];
  aiRisk: AIRiskAnalysis;
  news: NewsItem[];
  supplyChain: SupplyChain;
  earningsQuality: EarningsQuality;
  insiderActivity: InsiderTransaction[];
  researchMemo: ResearchMemo;
  hedgeFundAlpha: HedgeFundAlpha;
  sources?: string[];
}
