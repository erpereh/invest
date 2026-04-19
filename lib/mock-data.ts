export const positions = [
  {
    id: 1,
    ticker: 'VWCE',
    name: 'Vanguard FTSE All-World',
    type: 'ETF',
    color: '#3b82f6',
    initials: 'VW',
    quantity: 142,
    avgPrice: 98.24,
    currentPrice: 112.85,
    value: 16024.7,
    weight: 28.4,
    return: 14.87,
    returnAbs: 2074.82,
    sector: 'Global',
    region: 'Global',
  },
  {
    id: 2,
    ticker: 'IWDA',
    name: 'iShares Core MSCI World',
    type: 'ETF',
    color: '#6366f1',
    initials: 'IW',
    quantity: 210,
    avgPrice: 74.50,
    currentPrice: 83.20,
    value: 17472.0,
    weight: 30.9,
    return: 11.68,
    returnAbs: 1827.0,
    sector: 'Global',
    region: 'Desarrollados',
  },
  {
    id: 3,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    type: 'Acción',
    color: '#e5e7eb',
    initials: 'AP',
    quantity: 35,
    avgPrice: 162.40,
    currentPrice: 189.30,
    value: 6625.5,
    weight: 11.7,
    return: 16.56,
    returnAbs: 941.5,
    sector: 'Tecnología',
    region: 'EEUU',
  },
  {
    id: 4,
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    type: 'Acción',
    color: '#0ea5e9',
    initials: 'MS',
    quantity: 18,
    avgPrice: 310.20,
    currentPrice: 378.90,
    value: 6820.2,
    weight: 12.1,
    return: 22.15,
    returnAbs: 1236.6,
    sector: 'Tecnología',
    region: 'EEUU',
  },
  {
    id: 5,
    ticker: 'BRK.B',
    name: 'Berkshire Hathaway B',
    type: 'Acción',
    color: '#f59e0b',
    initials: 'BH',
    quantity: 22,
    avgPrice: 320.00,
    currentPrice: 298.40,
    value: 6564.8,
    weight: 11.6,
    return: -6.75,
    returnAbs: -475.2,
    sector: 'Financiero',
    region: 'EEUU',
  },
  {
    id: 6,
    ticker: 'CSP1',
    name: 'Amundi S&P 500',
    type: 'ETF',
    color: '#10b981',
    initials: 'SP',
    quantity: 55,
    avgPrice: 42.80,
    currentPrice: 48.60,
    value: 2673.0,
    weight: 4.7,
    return: 13.55,
    returnAbs: 319.0,
    sector: 'EEUU',
    region: 'EEUU',
  },
  {
    id: 7,
    ticker: 'EIMI',
    name: 'iShares MSCI EM IMI',
    type: 'ETF',
    color: '#f97316',
    initials: 'EM',
    quantity: 180,
    avgPrice: 22.40,
    currentPrice: 19.85,
    value: 3573.0,
    weight: 6.3,
    return: -11.38,
    returnAbs: -459.0,
    sector: 'Emergentes',
    region: 'Emergentes',
  },
]

export const portfolioHistory = [
  { date: '2023-01', value: 38200 },
  { date: '2023-02', value: 39100 },
  { date: '2023-03', value: 40500 },
  { date: '2023-04', value: 41200 },
  { date: '2023-05', value: 39800 },
  { date: '2023-06', value: 42300 },
  { date: '2023-07', value: 44100 },
  { date: '2023-08', value: 43600 },
  { date: '2023-09', value: 42000 },
  { date: '2023-10', value: 43500 },
  { date: '2023-11', value: 46200 },
  { date: '2023-12', value: 47800 },
  { date: '2024-01', value: 48400 },
  { date: '2024-02', value: 50100 },
  { date: '2024-03', value: 52300 },
  { date: '2024-04', value: 51200 },
  { date: '2024-05', value: 53400 },
  { date: '2024-06', value: 54800 },
  { date: '2024-07', value: 55900 },
  { date: '2024-08', value: 54200 },
  { date: '2024-09', value: 56100 },
  { date: '2024-10', value: 57400 },
  { date: '2024-11', value: 59800 },
  { date: '2024-12', value: 61200 },
  { date: '2025-01', value: 60100 },
  { date: '2025-02', value: 58900 },
  { date: '2025-03', value: 61500 },
  { date: '2025-04', value: 64753.2 },
]

export const portfolioHistoryDaily = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}`,
  value: 62000 + Math.sin(i * 0.4) * 1800 + i * 90 + Math.random() * 400,
}))

export const portfolioHistoryWeek = Array.from({ length: 7 }, (_, i) => ({
  date: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
  value: 63200 + Math.sin(i * 0.8) * 800 + i * 220,
}))

export const transactions = [
  { id: 1, date: '2025-04-15', asset: 'VWCE', name: 'Vanguard FTSE All-World', type: 'Compra', quantity: 5, price: 112.40, total: 562.0, commission: 1.50 },
  { id: 2, date: '2025-04-12', asset: 'MSFT', name: 'Microsoft Corp.', type: 'Dividendo', quantity: 18, price: 0.75, total: 13.5, commission: 0 },
  { id: 3, date: '2025-04-08', asset: 'AAPL', name: 'Apple Inc.', type: 'Compra', quantity: 3, price: 185.20, total: 555.6, commission: 1.50 },
  { id: 4, date: '2025-03-28', asset: 'IWDA', name: 'iShares Core MSCI World', type: 'Compra', quantity: 10, price: 81.40, total: 814.0, commission: 1.50 },
  { id: 5, date: '2025-03-20', asset: 'BRK.B', name: 'Berkshire Hathaway B', type: 'Venta', quantity: 5, price: 308.00, total: 1540.0, commission: 2.50 },
  { id: 6, date: '2025-03-15', asset: 'EIMI', name: 'iShares MSCI EM IMI', type: 'Compra', quantity: 30, price: 20.10, total: 603.0, commission: 1.50 },
  { id: 7, date: '2025-03-01', asset: 'CSP1', name: 'Amundi S&P 500', type: 'Compra', quantity: 15, price: 46.30, total: 694.5, commission: 1.50 },
  { id: 8, date: '2025-02-20', asset: 'VWCE', name: 'Vanguard FTSE All-World', type: 'Compra', quantity: 8, price: 108.70, total: 869.6, commission: 1.50 },
  { id: 9, date: '2025-02-10', asset: 'MSFT', name: 'Microsoft Corp.', type: 'Compra', quantity: 3, price: 362.50, total: 1087.5, commission: 2.00 },
  { id: 10, date: '2025-01-25', asset: 'AAPL', name: 'Apple Inc.', type: 'Dividendo', quantity: 35, price: 0.25, total: 8.75, commission: 0 },
  { id: 11, date: '2025-01-15', asset: 'IWDA', name: 'iShares Core MSCI World', type: 'Ingreso', quantity: 1, price: 2000.0, total: 2000.0, commission: 0 },
  { id: 12, date: '2024-12-20', asset: 'BRK.B', name: 'Berkshire Hathaway B', type: 'Compra', quantity: 10, price: 355.00, total: 3550.0, commission: 2.50 },
]

export const dividends = [
  { id: 1, asset: 'AAPL', name: 'Apple Inc.', date: '2025-05-15', amount: 8.75, perShare: 0.25, status: 'Estimado' },
  { id: 2, asset: 'MSFT', name: 'Microsoft Corp.', date: '2025-06-12', amount: 13.50, perShare: 0.75, status: 'Estimado' },
  { id: 3, asset: 'BRK.B', name: 'Berkshire Hathaway B', date: '2025-07-01', amount: 0, perShare: 0, status: 'Sin dividendo' },
  { id: 4, asset: 'VWCE', name: 'Vanguard FTSE All-World', date: '2025-07-04', amount: 71.0, perShare: 0.50, status: 'Estimado' },
  { id: 5, asset: 'IWDA', name: 'iShares Core MSCI World', date: '2025-08-01', amount: 42.0, perShare: 0.20, status: 'Estimado' },
]

export const monthlyReturns = [
  { month: 'Oct', value: 2.1 },
  { month: 'Nov', value: 4.8 },
  { month: 'Dic', value: 2.4 },
  { month: 'Ene', value: -1.8 },
  { month: 'Feb', value: -2.1 },
  { month: 'Mar', value: 4.4 },
  { month: 'Abr', value: 5.3 },
]

export const watchlist = [
  { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 842.30, change: 3.24, changeAbs: 26.42, market: 'NASDAQ' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', price: 448.20, change: 0.84, changeAbs: 3.74, market: 'NYSE' },
  { ticker: 'ASML', name: 'ASML Holding NV', price: 812.50, change: -1.24, changeAbs: -10.22, market: 'NASDAQ' },
  { ticker: 'NOVO B', name: 'Novo Nordisk B', price: 62.10, change: -0.32, changeAbs: -0.20, market: 'CPH' },
  { ticker: 'XEON', name: 'Xtrackers Euro Gov Bond', price: 192.80, change: 0.15, changeAbs: 0.29, market: 'XETRA' },
  { ticker: 'SGLN', name: 'iShares Physical Gold', price: 39.45, change: 1.88, changeAbs: 0.73, market: 'LSE' },
]

export const sectorData = [
  { name: 'Tecnología', value: 23.8, color: '#3b82f6' },
  { name: 'Financiero', value: 11.6, color: '#f59e0b' },
  { name: 'Salud', value: 8.4, color: '#10b981' },
  { name: 'Consumo', value: 7.2, color: '#6366f1' },
  { name: 'Energía', value: 5.1, color: '#f97316' },
  { name: 'Otros', value: 43.9, color: '#475569' },
]

export const regionData = [
  { name: 'EEUU', value: 55.3, color: '#3b82f6' },
  { name: 'Europa', value: 18.2, color: '#6366f1' },
  { name: 'Asia-Pac.', value: 14.1, color: '#10b981' },
  { name: 'Emergentes', value: 9.5, color: '#f97316' },
  { name: 'Otros', value: 2.9, color: '#475569' },
]

export const assetTypeData = [
  { name: 'ETF', value: 70.3, color: '#3b82f6' },
  { name: 'Acción', value: 25.4, color: '#6366f1' },
  { name: 'Fondo', value: 4.3, color: '#10b981' },
]

export const totalPortfolioValue = 64753.2
export const dailyChange = 842.30
export const dailyChangePct = 1.32
export const totalInvested = 55280.0
export const totalReturn = 9473.2
export const totalReturnPct = 17.13
