"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const tabs = ["Posiciones", "Sectores", "Regiones", "Activos"] as const

const positionsData = [
  { name: "iShares Core MSCI World", value: 28500, color: "#3b82f6" },
  { name: "Vanguard FTSE All-World", value: 8200, color: "#22c55e" },
  { name: "Apple Inc.", value: 4500, color: "#a855f7" },
  { name: "Microsoft Corp.", value: 3200, color: "#f59e0b" },
  { name: "Amundi S&P 500", value: 2100, color: "#ec4899" },
  { name: "Otros", value: 1350, color: "#64748b" },
]

const sectorsData = [
  { name: "Tecnología", value: 18500, color: "#3b82f6" },
  { name: "Finanzas", value: 9200, color: "#22c55e" },
  { name: "Salud", value: 7800, color: "#a855f7" },
  { name: "Consumo", value: 5600, color: "#f59e0b" },
  { name: "Industria", value: 4200, color: "#ec4899" },
  { name: "Otros", value: 2550, color: "#64748b" },
]

const regionsData = [
  { name: "Estados Unidos", value: 22000, color: "#3b82f6" },
  { name: "Europa", value: 12500, color: "#22c55e" },
  { name: "Asia Pacífico", value: 6800, color: "#a855f7" },
  { name: "Mercados Emergentes", value: 4200, color: "#f59e0b" },
  { name: "Otros", value: 2350, color: "#64748b" },
]

const assetsData = [
  { name: "ETFs", value: 38800, color: "#3b82f6" },
  { name: "Acciones", value: 7700, color: "#22c55e" },
  { name: "Fondos", value: 850, color: "#a855f7" },
  { name: "Efectivo", value: 500, color: "#64748b" },
]

const dataByTab: Record<typeof tabs[number], typeof positionsData> = {
  Posiciones: positionsData,
  Sectores: sectorsData,
  Regiones: regionsData,
  Activos: assetsData,
}

export function DistributionCard() {
  const [selectedTab, setSelectedTab] = useState<typeof tabs[number]>("Posiciones")
  const data = dataByTab[selectedTab]
  const total = data.reduce((acc, item) => acc + item.value, 0)

  return (
    <Card className="bg-card border-border rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Distribución
          </CardTitle>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-lg transition-all",
                  selectedTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-6">
          {/* Donut chart */}
          <div className="relative h-[180px] w-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload
                      const percent = ((item.value / total) * 100).toFixed(1)
                      return (
                        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                          <p className="text-xs font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.value.toLocaleString("es-ES")} € ({percent}%)
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground">
                {(total / 1000).toFixed(1)}k €
              </span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2 overflow-hidden">
            {data.slice(0, 5).map((item) => {
              const percent = ((item.value / total) * 100).toFixed(1)
              return (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {item.name}
                  </span>
                  <span className="text-xs font-medium text-foreground shrink-0">
                    {percent}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
