"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, DollarSign } from "lucide-react"

interface Dividend {
  ticker: string
  name: string
  date: string
  estimate: number
}

const upcomingDividends: Dividend[] = [
  { ticker: "AAPL", name: "Apple Inc.", date: "25 Abr 2026", estimate: 15.25 },
  { ticker: "MSFT", name: "Microsoft Corp.", date: "10 May 2026", estimate: 24.00 },
  { ticker: "VWCE", name: "Vanguard FTSE All-World", date: "15 Jun 2026", estimate: 45.50 },
  { ticker: "IWDA", name: "iShares Core MSCI World", date: "20 Jun 2026", estimate: 82.30 },
]

export function DividendsCard() {
  const totalEstimate = upcomingDividends.reduce((acc, d) => acc + d.estimate, 0)

  return (
    <Card className="bg-card border-border rounded-2xl h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Próximos dividendos
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{totalEstimate.toFixed(2)} €</span>
            <span>est.</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {upcomingDividends.map((dividend) => (
            <div
              key={dividend.ticker}
              className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-[10px] font-bold text-primary">
                    {dividend.ticker.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-foreground">{dividend.ticker}</span>
                  <span className="block text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {dividend.name}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                  <Calendar className="h-3 w-3" />
                  {dividend.date}
                </div>
                <span className="text-xs font-medium text-gain">
                  +{dividend.estimate.toFixed(2)} €
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
