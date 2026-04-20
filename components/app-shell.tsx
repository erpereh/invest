'use client'

import { useMemo, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { DashboardPage } from '@/components/pages/dashboard-page'
import { CarteraPage } from '@/components/pages/cartera-page'
import { TransaccionesPage } from '@/components/pages/transacciones-page'
import { ImportarPage } from '@/components/pages/importar-page'
import { FondosPage } from '@/components/pages/fondos-page'
import { AnalisisPage } from '@/components/pages/analisis-page'
import { AjustesPage } from '@/components/pages/ajustes-page'
import type { PortfolioDashboardData } from '@/lib/data/portfolio'

interface AppShellProps {
  data: PortfolioDashboardData
}

export function AppShell({ data }: AppShellProps) {
  const [activeTab, setActiveTab] = useState('dashboard')

  const page = useMemo(() => {
    const pages: Record<string, React.ReactNode> = {
      dashboard: <DashboardPage data={data} />,
      cartera: <CarteraPage data={data} />,
      movimientos: <TransaccionesPage data={data} />,
      importar: <ImportarPage data={data} />,
      fondos: <FondosPage data={data} />,
      analisis: <AnalisisPage data={data} />,
      ajustes: <AjustesPage data={data} />,
    }

    return pages[activeTab] ?? <DashboardPage data={data} />
  }, [activeTab, data])

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">{page}</main>
    </div>
  )
}
