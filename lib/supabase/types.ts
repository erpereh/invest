export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type TransactionType = 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'switch_in' | 'switch_out'
export type ImportType = 'manual' | 'csv' | 'excel' | 'image' | 'text'
export type ImportStatus = 'pending' | 'parsed' | 'validated' | 'imported' | 'failed' | 'cancelled'
export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'accepted' | 'rejected'

type Row<T> = T
type Insert<T> = Partial<T>
type Update<T> = Partial<T>
type Table<T> = {
  Row: Row<T>
  Insert: Insert<T>
  Update: Update<T>
  Relationships: []
}
type View<T> = {
  Row: Row<T>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      funds: Table<Fund>
      fund_navs: Table<FundNav>
      accounts: Table<Account>
      transactions: Table<Transaction>
      holdings_daily: Table<HoldingDaily>
      imports: Table<ImportJob>
      import_rows: Table<ImportRow>
      ai_analysis_logs: Table<AiAnalysisLog>
    }
    Views: {
      latest_fund_nav: View<LatestFundNav>
      current_holdings: View<CurrentHolding>
      portfolio_summary: View<PortfolioSummary>
      portfolio_distribution: View<PortfolioDistribution>
      recent_transactions: View<RecentTransaction>
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export interface Fund {
  id: string
  isin: string
  name: string
  management_company: string | null
  currency: string
  asset_class: string
  region: string | null
  category: string | null
  active: boolean
  metadata: Json
  created_at: string
  updated_at: string
}

export interface FundNav {
  id: string
  fund_id: string
  nav_date: string
  nav: number
  currency: string
  source: string
  raw_payload: Json
  created_at: string
}

export interface Account {
  id: string
  name: string
  provider: string
  base_currency: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  account_id: string
  fund_id: string
  transaction_type: TransactionType
  trade_date: string
  settlement_date: string | null
  amount_eur: number
  nav_used: number | null
  shares: number
  fee_amount: number | null
  source: string
  notes: string | null
  raw_import_id: string | null
  created_at: string
  updated_at: string
}

export interface HoldingDaily {
  id: string
  account_id: string
  fund_id: string
  holding_date: string
  shares: number
  avg_cost: number
  invested_amount: number
  nav: number
  market_value: number
  pnl_eur: number
  pnl_pct: number | null
  created_at: string
}

export interface ImportJob {
  id: string
  import_type: ImportType
  source_name: string
  original_filename: string | null
  status: ImportStatus
  parsed_rows: number | null
  accepted_rows: number | null
  rejected_rows: number | null
  raw_text: string | null
  raw_json: Json | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface ImportRow {
  id: string
  import_id: string
  row_index: number
  detected_fund_name: string | null
  detected_isin: string | null
  detected_transaction_type: TransactionType | null
  detected_trade_date: string | null
  detected_amount: number | null
  detected_shares: number | null
  detected_nav: number | null
  confidence: number | null
  normalized_json: Json | null
  validation_status: ValidationStatus
  validation_error: string | null
  created_at: string
}

export interface AiAnalysisLog {
  id: string
  analysis_type: string
  input_payload: Json
  output_payload: Json
  model: string
  created_at: string
}

export interface LatestFundNav {
  fund_id: string
  isin: string
  name: string
  nav_date: string
  nav: number
  currency: string
  source: string
  created_at: string
}

export interface CurrentHolding {
  id: string
  account_id: string
  account_name: string
  provider: string
  fund_id: string
  isin: string
  fund_name: string
  management_company: string | null
  asset_class: string
  region: string | null
  category: string | null
  holding_date: string
  shares: number
  avg_cost: number
  invested_amount: number
  nav: number
  market_value: number
  pnl_eur: number
  pnl_pct: number | null
  created_at: string
}

export interface PortfolioSummary {
  total_market_value: number
  total_invested_amount: number
  total_pnl_eur: number
  total_pnl_pct: number | null
  positions_count: number
  latest_holding_date: string | null
}

export interface PortfolioDistribution {
  fund_id: string
  isin: string
  fund_name: string
  asset_class: string
  region: string | null
  category: string | null
  market_value: number
  portfolio_weight_pct: number | null
}

export interface RecentTransaction {
  id: string
  trade_date: string
  settlement_date: string | null
  transaction_type: TransactionType
  amount_eur: number
  nav_used: number | null
  shares: number
  fee_amount: number | null
  source: string
  notes: string | null
  raw_import_id: string | null
  account_id: string
  account_name: string
  provider: string
  fund_id: string
  isin: string
  fund_name: string
  asset_class: string
  region: string | null
  category: string | null
  created_at: string
  updated_at: string
}
