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
import { useCompanyInfo } from "@/hooks/useCompanyInfo"
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
  CreditCard,
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
  const { companyInfo } = useCompanyInfo()

  const getNavItems = () => {
    if (!session?.user?.role) return []

    const baseItems = [
      {
        href: `/${language}/${session.user.role.toLowerCase()}`,
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
    ]

    switch (session.user.role) {
      case "ADMIN":
        return [
          ...baseItems,
          {
            href: `/${language}/admin/trips`,
            label: t("trips"),
            icon: Truck,
          },
          {
            href: `/${language}/admin/invoices`,
            label: t("invoices"),
            icon: FileText,
          },
          {
            href: `/${language}/admin/users`,
            label: t("users"),
            icon: Users,
          },
          {
            href: `/${language}/admin/vehicles`,
            label: t("vehicles"),
            icon: Truck,
          },
          {
            href: `/${language}/admin/pricing`,
            label: t("pricing"),
            icon: Calculator,
          },
          {
            href: `/${language}/admin/tracking`,
            label: t("tracking"),
            icon: MapPin,
          },
          {
            href: `/${language}/admin/settings`,
            label: t("settings"),
            icon: Settings,
          },
        ]
      case "CUSTOMER":
        return [
          ...baseItems,
          {
            href: `/${language}/customer/book-trip`,
            label: t("bookTrip"),
            icon: Truck,
          },
          {
            href: `/${language}/customer/my-trips`,
            label: t("myTrips"),
            icon: NavigationIcon,
          },
          {
            href: `/${language}/customer/invoices`,
            label: t("invoices"),
            icon: FileText,
          },
          {
            href: `/${language}/customer/payments`,
            label: t("payments"),
            icon: CreditCard,
          },
        ]
      case "DRIVER":
        return [
          ...baseItems,
          {
            href: `/${language}/driver/trips`,
            label: t("myTrips"),
            icon: Truck,
          },
          {
            href: `/${language}/driver/live-tracking`,
            label: t("liveTracking"),
            icon: MapPin,
          },
        ]
      case "ACCOUNTANT":
        return [
          ...baseItems,
          {
            href: `/${language}/accountant/invoices`,
            label: t("invoices"),
            icon: FileText,
          },
          {
            href: `/${language}/accountant/reports`,
            label: t("reports"),
            icon: Calculator,
          },
          {
            href: `/${language}/accountant/payments`,
            label: t("payments"),
            icon: Calculator,
          },
        ]
      case "CUSTOMS_BROKER":
        return [
          ...baseItems,
          {
            href: `/${language}/customs-broker/clearances`,
            label: t("clearances"),
            icon: Shield,
          },
          {
            href: `/${language}/customs-broker/invoices`,
            label: t("invoices"),
            icon: FileText,
          },
        ]
      default:
        return baseItems
    }
  }

  const navItems = getNavItems()

  const isActive = (href: string) => {
    // Get the current user's dashboard path
    const dashboardPath = `/${language}/${session?.user?.role?.toLowerCase()}`
    
    // Normalize paths by removing trailing slashes
    const normalizedPathname = pathname.replace(/\/$/, '') || '/';
    const normalizedHref = href.replace(/\/$/, '') || '/';
    
    // If this is the dashboard link
    if (normalizedHref === dashboardPath) {
      // Only active if we're exactly on the dashboard page
      return normalizedPathname === dashboardPath || normalizedPathname === `/${language}` || normalizedPathname === '/'
    }
    
    // For other routes, check exact match first, then prefix match
    if (normalizedPathname === normalizedHref) {
      return true
    }
    
    // Check if current path starts with the href (for sub-routes)
    if (normalizedPathname.startsWith(normalizedHref + '/')) {
      return true
    }
    
    return false
  }

  if (!session) {
    return (
      <nav className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 ${className}`} dir={dir}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between ">
            <Link href="/" className="flex items-center">
              <img 
                src={companyInfo.logo} 
                alt={companyInfo.name} 
                className="h-16 w-auto sm:h-20 md:h-24 lg:h-26 xl:h-30 object-contain" 
              />
            </Link>
            <div className="flex items-center space-x-4">
              <LanguageSelector variant="compact" showLabel={false} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 h-20 md:h-24 z-50 ${className}`} dir={dir}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between ">
          {/* Logo */}
          <Link href="/" className={`flex items-center ${dir === 'rtl' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
            <img 
              src={companyInfo.logo} 
              alt={companyInfo.name} 
              className="h-16 w-auto sm:h-20 md:h-24 lg:h-26 xl:h-28 object-contain" 
            />
          </Link>

          {/* Desktop Navigation - Hidden on mobile and tablet */}
          <div className={`hidden lg:flex items-center ${dir === 'rtl' ? 'space-x-reverse space-x-4 xl:space-x-6' : 'space-x-4 xl:space-x-6'}`}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${dir === 'rtl' ? 'space-x-reverse space-x-2' : 'space-x-2'} px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-3 w-3 xl:h-4 xl:w-4" />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Side - User Menu & Controls */}
          <div className={`flex items-center ${dir === 'rtl' ? 'space-x-reverse space-x-2 sm:space-x-3' : 'space-x-2 sm:space-x-3'}`}>
            {/* Language & Theme - Hidden on small screens */}
            <div className="hidden sm:flex items-center space-x-2">
              <LanguageSelector variant="compact" showLabel={false} />
              <ThemeToggle />
            </div>
            
            {/* Mobile Menu Button - Visible on tablet and mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            
            {/* User Avatar - Always visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarFallback className="text-xs sm:text-sm">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align={dir === 'rtl' ? 'start' : 'end'} forceMount>
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
                    <Settings className={`${dir === 'rtl' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    <span>{t("profile")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${language}/terms`}>
                    <FileText className={`${dir === 'rtl' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    <span>{t("termsAndConditions")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: `/${language}/auth/signin` })}>
                  <LogOut className={`${dir === 'rtl' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  <span>{t("signOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      </div>
      
      {/* Mobile Menu - Outside container but inside nav */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* Mobile Navigation Items */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center ${dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3'} px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
              
              {/* Mobile Language & Theme Controls */}
              <div className="sm:hidden pt-4 border-t mt-4">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium text-muted-foreground">{t("preferences")}</span>
                  <div className="flex items-center space-x-2">
                    <LanguageSelector variant="compact" showLabel={false} />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
