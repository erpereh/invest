'use client'

import { Globe, DollarSign, Bell, Download, Trash2, ChevronRight } from 'lucide-react'

const sections = [
  {
    title: 'General',
    items: [
      { label: 'Moneda principal', value: 'EUR — Euro', icon: DollarSign },
      { label: 'Idioma', value: 'Español', icon: Globe },
      { label: 'Zona horaria', value: 'Europe/Madrid (UTC+2)', icon: Globe },
    ],
  },
  {
    title: 'Notificaciones',
    items: [
      { label: 'Alertas de precio', value: 'Activadas', icon: Bell },
      { label: 'Resumen semanal', value: 'Cada lunes', icon: Bell },
      { label: 'Dividendos pendientes', value: '7 días antes', icon: Bell },
    ],
  },
  {
    title: 'Datos',
    items: [
      { label: 'Exportar cartera (CSV)', value: 'Descargar', icon: Download },
      { label: 'Exportar transacciones (CSV)', value: 'Descargar', icon: Download },
      { label: 'Borrar todos los datos', value: 'Peligroso', icon: Trash2, danger: true },
    ],
  },
]

export function AjustesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configuración de la aplicación</p>
      </div>

      <div className="max-w-2xl flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.title} className="bg-surface-1 border border-border/70 rounded-2xl overflow-hidden shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-5 pt-4 pb-2">{section.title}</p>
            {section.items.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-2/70 transition-colors duration-150 ease-out text-left ${
                    i < section.items.length - 1 ? 'border-b border-border/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${(item as { danger?: boolean }).danger ? 'text-loss' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`text-sm font-medium ${(item as { danger?: boolean }).danger ? 'text-loss' : 'text-foreground'}`}>
                      {item.label}
                    </span>
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

        {/* App info */}
        <div className="bg-surface-1 border border-border/70 rounded-2xl p-5 shadow-[0_14px_36px_oklch(0_0_0/0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_oklch(0_0_0/0.3)]">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Acerca de</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Versión</span>
              <span className="text-foreground font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Última sincronización</span>
              <span className="text-foreground font-medium">Hoy, 09:41</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Posiciones activas</span>
              <span className="text-foreground font-medium">7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
