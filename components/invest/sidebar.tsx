"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  PieChart,
  Eye,
  BarChart3,
  Settings,
  Crown,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavItem {
  label: string
  icon: React.ElementType
  active?: boolean
}

const navItems: NavItem[] = [
  { label: "Resumen", icon: LayoutDashboard, active: true },
  { label: "Cartera", icon: Briefcase },
  { label: "Transacciones", icon: ArrowLeftRight },
  { label: "Activos", icon: PieChart },
  { label: "Watchlist", icon: Eye },
  { label: "Análisis", icon: BarChart3 },
  { label: "Ajustes", icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [activeItem, setActiveItem] = useState("Resumen")

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden lg:flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">I</span>
          </div>
          {!collapsed && (
            <span className="text-xl font-semibold text-sidebar-foreground tracking-tight">
              Invest
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.label
          return (
            <button
              key={item.label}
              onClick={() => setActiveItem(item.label)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3 space-y-3">
        {/* Premium badge */}
        {!collapsed && (
          <div className="rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 p-3 border border-primary/30">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Plan Premium</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Acceso completo a todas las funciones
            </p>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="rounded-lg bg-primary/20 p-2">
              <Crown className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}

        {/* User profile */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent/50 transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9 border-2 border-primary/30">
            <AvatarImage src="/avatar.jpg" />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Carlos García</p>
              <p className="text-xs text-muted-foreground truncate">carlos@email.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
