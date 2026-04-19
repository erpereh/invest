"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, AlertTriangle, TrendingUp, PieChart, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Insight {
  id: string
  type: "warning" | "positive" | "info"
  icon: React.ElementType
  message: string
}

const insights: Insight[] = [
  {
    id: "1",
    type: "warning",
    icon: AlertTriangle,
    message: "Tu cartera está muy concentrada en renta variable (95%)",
  },
  {
    id: "2",
    type: "info",
    icon: PieChart,
    message: "El ETF MSCI World representa el 59.6% del total",
  },
  {
    id: "3",
    type: "positive",
    icon: TrendingUp,
    message: "Tus activos con mejor rendimiento este mes: AAPL (+9.09%)",
  },
]

const typeStyles: Record<Insight["type"], string> = {
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  positive: "bg-gain/10 border-gain/20 text-gain",
  info: "bg-accent/10 border-accent/20 text-accent",
}

export function InsightsCard() {
  return (
    <Card className="bg-card border-border rounded-2xl h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Insights IA
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {insights.map((insight) => {
          const Icon = insight.icon
          return (
            <div
              key={insight.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border",
                typeStyles[insight.type]
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">{insight.message}</p>
            </div>
          )
        })}
        
        <Button
          variant="outline"
          className="w-full mt-4 h-9 gap-2 rounded-xl border-border bg-secondary hover:bg-muted text-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Generar análisis
        </Button>
      </CardContent>
    </Card>
  )
}
