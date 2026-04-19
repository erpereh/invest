"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

const timeRanges = ["1D", "1W", "1M", "YTD", "1Y", "Max"] as const

// Generate realistic portfolio data
const generateData = (days: number, startValue: number, volatility: number) => {
  const data = []
  let value = startValue
  const now = new Date()
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const change = (Math.random() - 0.45) * volatility * value
    value = Math.max(value + change, startValue * 0.7)
    data.push({
      date: date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      value: Math.round(value),
    })
  }
  return data
}

// Move data generation inside the component to avoid hydration mismatches
const dataByRange: Record<typeof timeRanges[number], { days: number; start: number; vol: number }> = {
  "1D": { days: 1, start: 47850, vol: 0.002 },
  "1W": { days: 7, start: 46500, vol: 0.008 },
  "1M": { days: 30, start: 44000, vol: 0.015 },
  "YTD": { days: 108, start: 38000, vol: 0.025 },
  "1Y": { days: 365, start: 32000, vol: 0.035 },
  "Max": { days: 730, start: 20000, vol: 0.05 },
}

export function PortfolioValueCard() {
  const [mounted, setMounted] = useState(false)
  const [selectedRange, setSelectedRange] = useState<typeof timeRanges[number]>("1M")
  
  // Use a stable seed or just generate on mount to avoid hydration mismatch
  const [data, setData] = useState<ReturnType<typeof generateData>>([])
  
  useEffect(() => {
    const config = dataByRange[selectedRange]
    setData(generateData(config.days, config.start, config.vol))
    setMounted(true)
  }, [selectedRange])

  if (!mounted) {
    return <div className="h-[300px] w-full bg-card animate-pulse rounded-2xl" />
  }

  const currentValue = data[data.length - 1]?.value ?? 0
  const startValue = data[0]?.value ?? 0
  const change = currentValue - startValue
  const changePercent = ((change / startValue) * 100).toFixed(2)
  const isPositive = change >= 0

  return (
    <Card className="col-span-2 lg:col-span-1 bg-card border-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Valor total de la cartera
          </CardTitle>
          <div className="flex gap-1">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-lg transition-all",
                  selectedRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground tracking-tight">
              {currentValue.toLocaleString("es-ES")} €
            </span>
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositive ? "text-gain" : "text-loss"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{isPositive ? "+" : ""}{change.toLocaleString("es-ES")} €</span>
              <span className="text-muted-foreground">({isPositive ? "+" : ""}{changePercent}%)</span>
            </div>
          </div>
        </div>
        
        <div className="h-[180px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#666", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={["dataMin - 1000", "dataMax + 1000"]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-xs text-muted-foreground">{payload[0]?.payload?.date}</p>
                        <p className="text-sm font-semibold text-foreground">
                          {payload[0]?.value?.toLocaleString("es-ES")} €
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
