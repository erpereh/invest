import type { FundMetadataResult, NavProvider } from '@/lib/services/nav/types'
import { NavProviderError } from '@/lib/services/nav/utils'

export const morningstarProvider: NavProvider = {
  name: 'morningstar',
  supports() {
    return false
  },
  getSourceUrl() {
    return undefined
  },
  async fetchMetadataByIsin(isin) {
    return {
      isin: isin.trim().toUpperCase(),
      provider: this.name,
      sourceStatus: 'unsupported',
      rawPayload: {
        reason: 'No hay una URL publica estable de Morningstar mapeada para este ISIN.',
      },
    } satisfies FundMetadataResult
  },
  async fetchLatestNavByIsin(isin) {
    throw new NavProviderError(this.name, `Morningstar no tiene fuente publica estable mapeada para ${isin}.`)
  },
  async fetchHistoricalNavsByIsin(isin) {
    throw new NavProviderError(this.name, `Morningstar no tiene fuente publica estable mapeada para ${isin}.`)
  },
}
