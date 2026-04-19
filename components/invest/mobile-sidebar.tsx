"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  PieChart,
  Eye,
  BarChart3,
  Settings,
  Crown,
  Menu,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: "Resumen", icon: LayoutDashboard },
  { label: "Cartera", icon: Briefcase },
  { label: "Transacciones", icon: ArrowLeftRight },
  { label: "Activos", icon: PieChart },
  { label: "Watchlist", icon: Eye },
  { label: "Análisis", icon: BarChart3 },
  { label: "Ajustes", icon: Settings },
]

export function MobileSidebar() {
  const [activeItem, setActiveItem] = useState("Resumen")
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="h-16 flex flex-row items-center justify-start px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">I</span>
            </div>
            <SheetTitle className="text-xl font-semibold text-sidebar-foreground tracking-tight">
              Invest
            </SheetTitle>
          </div>
        </SheetHeader>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.label
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveItem(item.label)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-3">
          <div className="rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 p-3 border border-primary/30">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Plan Premium</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Acceso completo a todas las funciones
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
            <Avatar className="h-9 w-9 border-2 border-primary/30">
              <AvatarImage src="/avatar.jpg" />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Carlos García</p>
              <p className="text-xs text-muted-foreground truncate">carlos@email.com</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
