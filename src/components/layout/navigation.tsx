"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageSelector } from "@/components/ui/language-selector"
import { useLanguage } from "@/components/providers/language-provider"
import {
  Truck,
  Shield,
  Users,
  Calculator,
  FileText,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  MapPin,
  Navigation as NavigationIcon,
} from "lucide-react"
import { useState } from "react"

interface NavigationProps {
  className?: string
}

export function Navigation({ className }: NavigationProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { t, dir } = useLanguage()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getNavItems = () => {
    if (!session?.user?.role) return []

    const baseItems = [
      {
        href: "/dashboard",
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
    ]

    switch (session.user.role) {
      case "ADMIN":
        return [
          ...baseItems,
          { href: "/admin/users", label: t("users"), icon: Users },
          { href: "/admin/vehicles", label: t("vehicles"), icon: Truck },
          { href: "/admin/pricing", label: t("pricing"), icon: Calculator },
          { href: "/admin/trips", label: t("trips"), icon: FileText },
          { href: "/admin/tracking", label: t("tracking"), icon: MapPin },
          { href: "/admin/invoices", label: t("invoices"), icon: FileText },
          { href: "/admin/reports", label: t("reports"), icon: FileText },
          { href: "/admin/settings", label: t("settings"), icon: Settings },
        ]
      case "DRIVER":
        return [
          ...baseItems,
          { href: "/driver/trips", label: t("trips"), icon: FileText },
          { href: "/driver/tracking", label: t("tracking"), icon: NavigationIcon },
          { href: "/driver/profile", label: t("profile"), icon: User },
        ]
      case "CUSTOMER":
        return [
          ...baseItems,
          { href: "/customer/book-trip", label: t("bookTrip"), icon: FileText },
          { href: "/customer/my-trips", label: t("myTrips"), icon: FileText },
          { href: "/customer/tracking", label: t("tracking"), icon: MapPin },
          { href: "/customer/invoices", label: t("invoices"), icon: FileText },
          { href: "/customer/profile", label: t("profile"), icon: User },
        ]
      case "ACCOUNTANT":
        return [
          ...baseItems,
          { href: "/accountant/invoices", label: t("invoices"), icon: FileText },
          { href: "/accountant/reports", label: t("reports"), icon: FileText },
          { href: "/accountant/payments", label: t("payments"), icon: Calculator },
        ]
      case "CUSTOMS_BROKER":
        return [
          ...baseItems,
          { href: "/customs-broker/shipments", label: t("trips"), icon: FileText },
          { href: "/customs-broker/fees", label: t("pricing"), icon: Calculator },
          { href: "/customs-broker/profile", label: t("profile"), icon: User },
        ]
      default:
        return baseItems
    }
  }

  const navItems = getNavItems()

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  if (!session) {
    return (
      <nav className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary">{t("brandName")}</h1>
              <p className="text-xs text-muted-foreground">{t("brandTagline")}</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <ThemeToggle />
            <Link href="/auth/signin">
              <Button>{t("signIn")}</Button>
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary">{t("brandName")}</h1>
              <p className="text-xs text-muted-foreground">{t("brandTagline")}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {t(session.user.role.toLowerCase() as any)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t("profile")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t("settings")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("signOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}