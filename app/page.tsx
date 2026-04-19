"use client"

import { useState } from "react"
import { Sidebar } from "@/components/invest/sidebar"
import { Topbar } from "@/components/invest/topbar"
import { PortfolioValueCard } from "@/components/invest/portfolio-value-card"
import { DistributionCard } from "@/components/invest/distribution-card"
import { PositionsCard } from "@/components/invest/positions-card"
import { InsightsCard } from "@/components/invest/insights-card"
import { TransactionsCard } from "@/components/invest/transactions-card"
import { GainersLosersCard } from "@/components/invest/gainers-losers-card"
import { DividendsCard } from "@/components/invest/dividends-card"
import { MonthlyReturnCard } from "@/components/invest/monthly-return-card"

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Topbar */}
      <Topbar sidebarCollapsed={sidebarCollapsed} />

      {/* Main content */}
      <main
        className={`pt-16 transition-all duration-300 pl-0 lg:pl-[260px] ${
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Resumen de cartera
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenido de nuevo, Carlos. Aquí tienes el estado de tus inversiones.
              </p>
            </div>
          </div>

          {/* First row: Portfolio value + Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioValueCard />
            <DistributionCard />
          </div>

          {/* Second row: Positions + Insights */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <PositionsCard />
            <InsightsCard />
          </div>

          {/* Third row: Transactions */}
          <TransactionsCard />

          {/* Fourth row: Gainers/Losers + Dividends + Monthly return */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <GainersLosersCard />
            <DividendsCard />
            <MonthlyReturnCard />
          </div>
        </div>
      </main>
    </div>
  )
}
