import { AppShell } from '@/components/app-shell'
import { getPortfolioDashboardData } from '@/lib/data/portfolio'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const data = await getPortfolioDashboardData()
  return <AppShell data={data} />
}
