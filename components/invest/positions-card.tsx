"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Position {
  ticker: string
  name: string
  type: "ETF" | "Acción" | "Fondo"
  quantity: number
  avgPrice: number
  currentPrice: number
  value: number
  weight: number
  return: number
  returnPercent: number
}

const positions: Position[] = [
  {
    ticker: "IWDA",
    name: "iShares Core MSCI World",
    type: "ETF",
    quantity: 320,
    avgPrice: 78.50,
    currentPrice: 89.06,
    value: 28500,
    weight: 59.6,
    return: 3380,
    returnPercent: 13.46,
  },
  {
    ticker: "VWCE",
    name: "Vanguard FTSE All-World",
    type: "ETF",
    quantity: 75,
    avgPrice: 98.20,
    currentPrice: 109.33,
    value: 8200,
    weight: 17.1,
    return: 835,
    returnPercent: 11.34,
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    type: "Acción",
    quantity: 25,
    avgPrice: 165.00,
    currentPrice: 180.00,
    value: 4500,
    weight: 9.4,
    return: 375,
    returnPercent: 9.09,
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp.",
    type: "Acción",
    quantity: 8,
    avgPrice: 380.00,
    currentPrice: 400.00,
    value: 3200,
    weight: 6.7,
    return: 160,
    returnPercent: 5.26,
  },
  {
    ticker: "AMUNDI",
    name: "Amundi S&P 500",
    type: "Fondo",
    quantity: 15,
    avgPrice: 145.00,
    currentPrice: 140.00,
    value: 2100,
    weight: 4.4,
    return: -75,
    returnPercent: -3.45,
  },
  {
    ticker: "EEM",
    name: "Emerging Markets ETF",
    type: "ETF",
    quantity: 35,
    avgPrice: 42.00,
    currentPrice: 38.57,
    value: 1350,
    weight: 2.8,
    return: -120,
    returnPercent: -8.16,
  },
]

const typeColors: Record<Position["type"], string> = {
  ETF: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Acción: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Fondo: "bg-amber-500/20 text-amber-400 border-amber-500/30",
}

export function PositionsCard() {
  return (
    <Card className="col-span-2 bg-card border-border rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Posiciones
          </CardTitle>
          <Button size="sm" className="h-8 gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">Añadir posición</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Activo</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Cantidad</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Precio medio</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Valor actual</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Peso</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Rentabilidad</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => {
                const isPositive = position.return >= 0
                return (
                  <tr
                    key={position.ticker}
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-foreground">
                          {position.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{position.ticker}</span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", typeColors[position.type])}>
                              {position.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{position.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm text-foreground">{position.quantity}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm text-foreground">{position.avgPrice.toFixed(2)} €</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm font-medium text-foreground">
                        {position.value.toLocaleString("es-ES")} €
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${position.weight}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {position.weight}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className={cn("flex items-center justify-end gap-1", isPositive ? "text-gain" : "text-loss")}>
                        {isPositive ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        <span className="text-sm font-medium">
                          {isPositive ? "+" : ""}{position.return.toLocaleString("es-ES")} €
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({isPositive ? "+" : ""}{position.returnPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
