"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, ArrowDownLeft, ArrowUpRight, Coins, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  date: string
  asset: string
  ticker: string
  type: "compra" | "venta" | "dividendo" | "comisión"
  quantity: number | null
  price: number | null
  total: number
}

const transactions: Transaction[] = [
  {
    id: "1",
    date: "15 Abr 2026",
    asset: "iShares Core MSCI World",
    ticker: "IWDA",
    type: "compra",
    quantity: 10,
    price: 89.06,
    total: 890.60,
  },
  {
    id: "2",
    date: "12 Abr 2026",
    asset: "Apple Inc.",
    ticker: "AAPL",
    type: "dividendo",
    quantity: null,
    price: null,
    total: 15.25,
  },
  {
    id: "3",
    date: "10 Abr 2026",
    asset: "Microsoft Corp.",
    ticker: "MSFT",
    type: "compra",
    quantity: 2,
    price: 400.00,
    total: 800.00,
  },
  {
    id: "4",
    date: "08 Abr 2026",
    asset: "Vanguard FTSE All-World",
    ticker: "VWCE",
    type: "venta",
    quantity: 5,
    price: 109.33,
    total: 546.65,
  },
  {
    id: "5",
    date: "05 Abr 2026",
    asset: "Interactive Brokers",
    ticker: "IBKR",
    type: "comisión",
    quantity: null,
    price: null,
    total: -2.50,
  },
  {
    id: "6",
    date: "01 Abr 2026",
    asset: "iShares Core MSCI World",
    ticker: "IWDA",
    type: "compra",
    quantity: 15,
    price: 88.50,
    total: 1327.50,
  },
]

const typeFilters = ["Todos", "Compra", "Venta", "Dividendo", "Comisión"] as const

const typeConfig: Record<Transaction["type"], { icon: React.ElementType; color: string; label: string }> = {
  compra: { icon: ArrowDownLeft, color: "bg-gain/20 text-gain", label: "Compra" },
  venta: { icon: ArrowUpRight, color: "bg-loss/20 text-loss", label: "Venta" },
  dividendo: { icon: Coins, color: "bg-amber-500/20 text-amber-400", label: "Dividendo" },
  comisión: { icon: CreditCard, color: "bg-muted text-muted-foreground", label: "Comisión" },
}

export function TransactionsCard() {
  const [selectedFilter, setSelectedFilter] = useState<typeof typeFilters[number]>("Todos")
  const [search, setSearch] = useState("")

  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter = selectedFilter === "Todos" || t.type.toLowerCase() === selectedFilter.toLowerCase()
    const matchesSearch = t.asset.toLowerCase().includes(search.toLowerCase()) || 
                         t.ticker.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <Card className="col-span-2 bg-card border-border rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Transacciones
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {typeFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-lg transition-all",
                    selectedFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
            <Button size="sm" className="h-8 gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs">Nueva transacción</span>
            </Button>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por activo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs pl-10 h-9 bg-secondary border-border rounded-xl text-sm placeholder:text-muted-foreground"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Fecha</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Activo</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Cantidad</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Precio</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const config = typeConfig[transaction.type]
                const Icon = config.icon
                return (
                  <tr
                    key={transaction.id}
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-2">
                      <span className="text-sm text-muted-foreground">{transaction.date}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-foreground">
                          {transaction.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">{transaction.ticker}</span>
                          <span className="block text-xs text-muted-foreground truncate max-w-[150px]">
                            {transaction.asset}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className={cn("gap-1 text-[10px] px-2 py-0.5", config.color)}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm text-foreground">
                        {transaction.quantity ?? "-"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm text-foreground">
                        {transaction.price ? `${transaction.price.toFixed(2)} €` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={cn(
                        "text-sm font-medium",
                        transaction.total >= 0 ? "text-foreground" : "text-loss"
                      )}>
                        {transaction.total >= 0 ? "" : ""}{transaction.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
