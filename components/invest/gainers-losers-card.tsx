"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Asset {
  ticker: string
  name: string
  change: number
  changePercent: number
}

const gainers: Asset[] = [
  { ticker: "AAPL", name: "Apple Inc.", change: 375, changePercent: 9.09 },
  { ticker: "IWDA", name: "iShares Core MSCI World", change: 3380, changePercent: 13.46 },
  { ticker: "VWCE", name: "Vanguard FTSE All-World", change: 835, changePercent: 11.34 },
]

const losers: Asset[] = [
  { ticker: "EEM", name: "Emerging Markets ETF", change: -120, changePercent: -8.16 },
  { ticker: "AMUNDI", name: "Amundi S&P 500", change: -75, changePercent: -3.45 },
]

export function GainersLosersCard() {
  return (
    <Card className="bg-card border-border rounded-2xl h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Mejores y peores posiciones
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Top Gainers */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-gain" />
            <span className="text-xs font-medium text-gain">Top Gainers</span>
          </div>
          <div className="space-y-2">
            {gainers.map((asset) => (
              <div
                key={asset.ticker}
                className="flex items-center justify-between p-2 rounded-xl bg-gain/5 border border-gain/10 hover:bg-gain/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-foreground">
                    {asset.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground">{asset.ticker}</span>
                    <span className="block text-[10px] text-muted-foreground truncate max-w-[100px]">
                      {asset.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-gain">
                    +{asset.changePercent.toFixed(2)}%
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    +{asset.change.toLocaleString("es-ES")} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-loss" />
            <span className="text-xs font-medium text-loss">Top Losers</span>
          </div>
          <div className="space-y-2">
            {losers.map((asset) => (
              <div
                key={asset.ticker}
                className="flex items-center justify-between p-2 rounded-xl bg-loss/5 border border-loss/10 hover:bg-loss/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-foreground">
                    {asset.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground">{asset.ticker}</span>
                    <span className="block text-[10px] text-muted-foreground truncate max-w-[100px]">
                      {asset.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-loss">
                    {asset.changePercent.toFixed(2)}%
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {asset.change.toLocaleString("es-ES")} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
