'use client'

import { Globe, DollarSign, Bell, Download, Trash2, ChevronRight, RefreshCw } from 'lucide-react'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'

export function AjustesPage({ data }: { data: PortfolioDashboardData }) {
  const sections = [
    {
      title: 'General',
      items: [
        { label: 'Moneda principal', value: 'EUR - Euro', icon: DollarSign },
        { label: 'Idioma', value: 'Espanol', icon: Globe },
        { label: 'Zona horaria', value: 'Europe/Madrid', icon: Globe },
      ],
    },
    {
      title: 'Datos',
      items: [
        { label: 'Fondos activos', value: String(data.funds.filter((fund) => fund.active).length), icon: RefreshCw },
        { label: 'Ultimos NAVs', value: String(data.latestNavs.length), icon: Bell },
        { label: 'Movimientos recientes', value: String(data.recentTransactions.length), icon: Download },
      ],
    },
    {
      title: 'Privacidad',
      items: [
        { label: 'Modo de acceso', value: 'Privado sin login', icon: Globe },
        { label: 'Escrituras', value: 'Solo backend', icon: RefreshCw },
        { label: 'Borrar todos los datos', value: 'Peligroso', icon: Trash2, danger: true },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configuracion de la herramienta privada</p>
      </div>

      <div className="max-w-2xl flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.title} className="bg-surface-1 border border-border/70 rounded-2xl overflow-hidden shadow-[0_14px_36px_oklch(0_0_0/0.22)]">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-5 pt-4 pb-2">{section.title}</p>
            {section.items.map((item, index) => {
              const Icon = item.icon
              return (
                <button key={item.label} className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-2/70 transition-colors duration-150 ease-out text-left ${index < section.items.length - 1 ? 'border-b border-border/30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${item.danger ? 'text-loss' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`text-sm font-medium ${item.danger ? 'text-loss' : 'text-foreground'}`}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.value}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
