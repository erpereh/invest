'use client'

import { PatrimonioCard } from '@/components/dashboard/patrimonio-card'
import { DistribucionCard } from '@/components/dashboard/distribucion-card'
import { PosicionesCard } from '@/components/dashboard/posiciones-card'
import { InsightsCard } from '@/components/dashboard/insights-card'
import { TransaccionesCard } from '@/components/dashboard/transacciones-card'
import { MejoresPeoresCard, ProximosDividendosCard, RentabilidadMensualCard } from '@/components/dashboard/bottom-cards'

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: Patrimonio + Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PatrimonioCard />
        </div>
        <div>
          <DistribucionCard />
        </div>
      </div>

      {/* Row 2: Posiciones + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PosicionesCard />
        </div>
        <div>
          <InsightsCard />
        </div>
      </div>

      {/* Row 3: Transacciones */}
      <TransaccionesCard />

      {/* Row 4: Bottom cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MejoresPeoresCard />
        <ProximosDividendosCard />
        <RentabilidadMensualCard />
      </div>
    </div>
  )
}
