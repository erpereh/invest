"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"

const monthlyData = [
  { month: "Ene", return: 2.4 },
  { month: "Feb", return: -1.2 },
  { month: "Mar", return: 3.8 },
  { month: "Abr", return: 1.5 },
]

export function MonthlyReturnCard() {
  const currentMonth = monthlyData[monthlyData.length - 1]
  const ytdReturn = monthlyData.reduce((acc, m) => acc + m.return, 0)

  return (
    <Card className="bg-card border-border rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Rentabilidad mensual
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>2026</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-muted-foreground">Este mes</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-gain" />
              <span className="text-lg font-bold text-gain">+{currentMonth?.return}%</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">YTD</span>
            <p className="text-lg font-bold text-gain">+{ytdReturn.toFixed(1)}%</p>
          </div>
        </div>

        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#666", fontSize: 10 }}
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0]?.value as number
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-xs text-muted-foreground">{payload[0]?.payload?.month} 2026</p>
                        <p className={`text-sm font-semibold ${value >= 0 ? "text-gain" : "text-loss"}`}>
                          {value >= 0 ? "+" : ""}{value}%
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.return >= 0 ? "#22c55e" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
