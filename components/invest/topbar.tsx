"use client"

import { Search, Plus, Bell, ChevronDown, Wallet, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileSidebar } from "./mobile-sidebar"

interface TopbarProps {
  sidebarCollapsed: boolean
}

export function Topbar({ sidebarCollapsed }: TopbarProps) {
  return (
    <header
      className={`fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 transition-all duration-300 left-0 lg:left-[260px] ${
        sidebarCollapsed ? "lg:left-[72px]" : "lg:left-[260px]"
      }`}
    >
      {/* Mobile menu + Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <MobileSidebar />
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar acciones, ETFs, fondos o ISIN..."
            className="w-full pl-10 pr-4 h-10 bg-secondary border-border rounded-xl text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
          />
        </div>
        </div>

      {/* Right section */}
      <div className="flex items-center gap-3 ml-6">
        {/* Portfolio selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 gap-2 rounded-xl border-border bg-secondary hover:bg-muted">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline text-sm">Mi Cartera Principal</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border rounded-xl">
            <DropdownMenuItem className="rounded-lg cursor-pointer">
              <Wallet className="h-4 w-4 mr-2 text-primary" />
              Mi Cartera Principal
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer">
              <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
              Cartera Dividendos
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer">
              <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
              Cartera Crypto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add transaction button */}
        <Button className="h-9 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Añadir transacción</span>
        </Button>

        {/* Add account button */}
        <Button variant="outline" className="h-9 gap-2 rounded-xl border-border bg-secondary hover:bg-muted">
          <Building2 className="h-4 w-4" />
          <span className="hidden md:inline text-sm">Añadir cuenta</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User avatar */}
        <Avatar className="h-9 w-9 border-2 border-border cursor-pointer hover:border-primary/50 transition-colors">
          <AvatarImage src="/avatar.jpg" />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">CG</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
