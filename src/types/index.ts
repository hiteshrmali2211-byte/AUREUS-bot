export interface Strategy {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  timeframe: string;
  mql5Snippet: string;
  winRate?: number;
  profitFactor?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  createdAt: any;
  updatedAt: any;
}

export interface ResearchReport {
  id: string;
  userId: string;
  topic: string;
  modelUsed: string;
  summary: string;
  fullReport: string;
  sourcesScanned?: number;
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  model?: string;
  createdAt: any;
  updatedAt: any;
}

export interface MT5Account {
  id: string;
  userId: string;
  accountName: string;
  accountNumber: string;
  brokerServer: string;
  accountType: 'Demo' | 'Live' | 'Prop Firm (FTMO/MFF)';
  leverage?: string;
  currency?: string;
  balance?: number;
  equity?: number;
  isAlgoActive?: boolean;
  spreadGuardPips?: number;
  maxDailyLossPercent?: number;
  bridgeUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export type ActiveTab = 'flagship' | 'research' | 'mql5' | 'simulator' | 'markets' | 'chat' | 'mt5';
