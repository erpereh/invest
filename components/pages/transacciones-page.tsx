'use client'

import { TransaccionesCard } from '@/components/dashboard/transacciones-card'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'

export function TransaccionesPage({ data }: { data: PortfolioDashboardData }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Movimientos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Compras, ventas, traspasos y switches de fondos indexados</p>
      </div>
      <TransaccionesCard transactions={data.recentTransactions} funds={data.funds} accounts={data.accounts} diagnostics={data.diagnostics} />
    </div>
  )
}
