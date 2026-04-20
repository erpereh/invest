'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  BarChart3,
  Database,
  TrendingUp,
  Settings,
  Search,
  Plus,
  Download,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'cartera', label: 'Cartera', icon: Briefcase },
  { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { id: 'fondos', label: 'Fondos', icon: Database },
  { id: 'analisis', label: 'Analisis', icon: BarChart3 },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
]

interface NavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-4 sm:px-6">
      <nav
        className="flex items-center gap-1 px-3 py-2 rounded-2xl border border-border/60"
        style={{
          background: 'oklch(0.145 0.012 255 / 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px oklch(0 0 0 / 0.4), 0 1px 0 oklch(1 1 1 / 0.05) inset',
        }}
      >
        <div className="flex items-center gap-2 mr-2 px-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">Invest</span>
        </div>

        <div className="w-px h-5 bg-border/60 mx-1" />

        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-out whitespace-nowrap hover:-translate-y-px',
                  isActive
                    ? 'bg-primary/18 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-3/75'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="w-px h-5 bg-border/60 mx-1 hidden md:block" />

        <div className="flex items-center gap-1.5 shrink-0">
          {searchOpen ? (
            <div className="flex items-center gap-1.5 bg-surface-2 border border-border/60 rounded-xl px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ISIN o fondo..."
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-36"
              />
              <button
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery('')
                }}
                aria-label="Cerrar busqueda"
              >
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground transition-colors duration-150 ease-out" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-3/75 transition-[background-color,color,transform] duration-150 ease-out hover:-translate-y-px"
              aria-label="Buscar fondo"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onTabChange('importar')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-3/75 transition-[background-color,color,transform] duration-150 ease-out hover:-translate-y-px"
            aria-label="Importar movimientos"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Importar</span>
          </button>

          <button
            onClick={() => onTabChange('movimientos')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-[background-color,color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anadir</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
