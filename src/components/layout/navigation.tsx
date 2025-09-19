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
  Truck,
} from "lucide-react"
import { useState } from "react"

interface NavigationProps {
  className?: string
}

export function Navigation({ className }: NavigationProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { t, dir, language } = useLanguage()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getNavItems = () => {
    if (!session?.user?.role) return []

    const baseItems = [
      {
        href: `/${language}/dashboard`,
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
    ]

    switch (session.user.role) {
      case "ADMIN":
        return [
          ...baseItems,
          { href: `/${language}/admin/users`, label: t("users"), icon: Users },
          { href: `/${language}/admin/vehicles`, label: t("vehicles"), icon: Truck },
          { href: `/${language}/admin/pricing`, label: t("pricing"), icon: Calculator },
          { href: `/${language}/admin/trips`, label: t("trips"), icon: FileText },
          { href: `/${language}/admin/tracking`, label: t("tracking"), icon: MapPin },
          { href: `/${language}/admin/invoices`, label: t("invoices"), icon: FileText },
          { href: `/${language}/admin/reports`, label: t("reports"), icon: FileText },
          { href: `/${language}/admin/settings`, label: t("settings"), icon: Settings },

        ]
      case "DRIVER":
        return [
          ...baseItems,
          { href: `/${language}/driver/trips`, label: t("trips"), icon: FileText },
          { href: `/${language}/driver/tracking`, label: t("tracking"), icon: NavigationIcon },
          { href: `/${language}/profile`, label: t("profile"), icon: User },
        ]
      case "CUSTOMER":
        return [
          ...baseItems,
          { href: `/${language}/customer/book-trip`, label: t("bookTrip"), icon: FileText },
          { href: `/${language}/customer/my-trips`, label: t("myTrips"), icon: FileText },
          { href: `/${language}/customer/tracking`, label: t("tracking"), icon: MapPin },
          { href: `/${language}/customer/invoices`, label: t("invoices"), icon: FileText },

        ]
      case "ACCOUNTANT":
        return [
          ...baseItems,
          { href: `/${language}/accountant/invoices`, label: t("invoices"), icon: FileText },
          { href: `/${language}/accountant/reports`, label: t("reports"), icon: FileText },
          { href: `/${language}/accountant/payments`, label: t("payments"), icon: Calculator },
          // { href: `/${language}/accountant/settings`, label: t("settings"), icon: Settings },
        ]
      case "CUSTOMS_BROKER":
        return [
          ...baseItems,
          { href: `/${language}/customs-broker/shipments`, label: t("trips"), icon: FileText },
          { href: `/${language}/customs-broker/fees`, label: t("pricing"), icon: Calculator },

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
          <Link href={`/${language}`} className="flex items-center space-x-3">
            <img 
              src="/Website-Logo.png" 
              alt="Logo" 
              className="h-[100px] w-auto object-contain" 
            />
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href={`/${language}/terms`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("termsAndConditions")}
            </Link>
            <LanguageSelector />
            <ThemeToggle />
            <Link href={`/${language}/auth/signin`}>
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
            <img 
              src="/Website-Logo.png" 
              alt="Logo" 
              className="h-[100px] w-auto object-contain" 
            />
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
                  <Link href={`/${language}/profile`}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t("profile")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${language}/terms`}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{t("termsAndConditions")}</span>
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
              
              {/* Terms and Conditions Link */}
              <Link
                href={`/${language}/terms`}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FileText className="h-4 w-4" />
                <span>{t("termsAndConditions")}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}