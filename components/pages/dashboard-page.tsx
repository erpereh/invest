'use client'

import { PatrimonioCard } from '@/components/dashboard/patrimonio-card'
import { DistribucionCard } from '@/components/dashboard/distribucion-card'
import { PosicionesCard } from '@/components/dashboard/posiciones-card'
import { InsightsCard } from '@/components/dashboard/insights-card'
import { TransaccionesCard } from '@/components/dashboard/transacciones-card'
import { MejoresPeoresCard, UltimosNavsCard, RentabilidadMensualCard } from '@/components/dashboard/bottom-cards'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'

interface DashboardPageProps {
  data: PortfolioDashboardData
}

export function DashboardPage({ data }: DashboardPageProps) {
  return (
    <div className="flex flex-col gap-5">
      {data.error ? (
        <div className="bg-loss-muted border border-loss/30 rounded-2xl p-4 text-sm text-loss">
          {data.error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PatrimonioCard summary={data.summary} evolution={data.evolution} />
        </div>
        <div>
          <DistribucionCard data={data} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PosicionesCard holdings={data.holdings} />
        </div>
        <div>
          <InsightsCard data={data} />
        </div>
      </div>

      <TransaccionesCard transactions={data.recentTransactions} funds={data.funds} accounts={data.accounts} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MejoresPeoresCard holdings={data.holdings} />
        <UltimosNavsCard navs={data.latestNavs} />
        <RentabilidadMensualCard evolution={data.evolution} />
      </div>
    </div>
  )
}
