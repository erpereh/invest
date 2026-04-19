'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { DashboardPage } from '@/components/pages/dashboard-page'
import { CarteraPage } from '@/components/pages/cartera-page'
import { TransaccionesPage } from '@/components/pages/transacciones-page'
import { DividendosPage } from '@/components/pages/dividendos-page'
import { WatchlistPage } from '@/components/pages/watchlist-page'
import { AnalisisPage } from '@/components/pages/analisis-page'
import { AjustesPage } from '@/components/pages/ajustes-page'

const pages: Record<string, React.ReactNode> = {
  dashboard: <DashboardPage />,
  cartera: <CarteraPage />,
  transacciones: <TransaccionesPage />,
  dividendos: <DividendosPage />,
  watchlist: <WatchlistPage />,
  analisis: <AnalisisPage />,
  ajustes: <AjustesPage />,
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {pages[activeTab] ?? <DashboardPage />}
      </main>
    </div>
  )
}
