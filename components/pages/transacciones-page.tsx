'use client'

import { TransaccionesCard } from '@/components/dashboard/transacciones-card'

export function TransaccionesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Transacciones</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Historial completo de movimientos</p>
      </div>
      <TransaccionesCard />
    </div>
  )
}
