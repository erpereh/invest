'use client'

import type { PortfolioDashboardData } from '@/lib/data/portfolio'
import type { Json } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/data/format'
import { cn } from '@/lib/utils'

export function FondosPage({ data }: { data: PortfolioDashboardData }) {
  const navByFund = new Map(data.latestNavs.map((nav) => [nav.fund_id, nav]))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Fondos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Catalogo privado de fondos indexados soportados por ISIN</p>
      </div>

      <div className="bg-surface-1 border border-border/70 rounded-2xl overflow-hidden shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[920px]">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-3 pl-5 text-muted-foreground font-medium">ISIN</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Fondo</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Gestora</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Region</th>
                <th className="text-right py-3 text-muted-foreground font-medium">Ultimo NAV</th>
                <th className="text-right py-3 text-muted-foreground font-medium">Fecha</th>
                <th className="text-right py-3 pr-5 text-muted-foreground font-medium">Fuente</th>
              </tr>
            </thead>
            <tbody>
              {data.funds.length > 0 ? data.funds.map((fund, index) => {
                const nav = navByFund.get(fund.id)
                const metadata = asMetadata(fund.metadata)
                const sourceStatus = String(metadata.nav_last_status ?? (nav ? 'success' : 'pending'))
                const sourceLabel = String(metadata.nav_provider ?? nav?.source ?? 'Sin fuente')
                return (
                  <tr key={fund.id} className={index < data.funds.length - 1 ? 'border-b border-border/20' : ''}>
                    <td className="py-3.5 pl-5 font-semibold text-foreground">{fund.isin}</td>
                    <td className="py-3.5 text-muted-foreground max-w-[260px] truncate">{fund.name}</td>
                    <td className="py-3.5 text-muted-foreground">{fund.management_company ?? 'N/D'}</td>
                    <td className="py-3.5 text-muted-foreground">{fund.region ?? 'N/D'}</td>
                    <td className="py-3.5 text-right text-foreground font-medium">{nav ? formatCurrency(Number(nav.nav), 4) : 'Sin NAV'}</td>
                    <td className="py-3.5 text-right text-muted-foreground">{nav ? new Date(nav.nav_date).toLocaleDateString('es-ES') : 'N/D'}</td>
                    <td className="py-3.5 pr-5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            'inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase',
                            sourceStatus === 'success' && 'bg-gain-muted text-gain',
                            sourceStatus === 'failed' && 'bg-loss-muted text-loss',
                            sourceStatus !== 'success' && sourceStatus !== 'failed' && 'bg-surface-2 text-muted-foreground'
                          )}
                        >
                          {sourceStatus === 'success' ? 'OK' : sourceStatus === 'failed' ? 'Error' : 'Pendiente'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{sourceLabel}</span>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">No hay fondos en Supabase.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function asMetadata(value: Json) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, Json | undefined>
}
