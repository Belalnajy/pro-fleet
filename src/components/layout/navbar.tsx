"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Truck, 
  Shield, 
  Users, 
  Calculator, 
  FileText, 
  Menu, 
  X,
  Home,
  Settings,
  LogOut,
  Bell,
  Search
} from "lucide-react"
import { useState } from "react"
import { UserRole } from "@prisma/client"

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getRoleBasedNavItems = () => {
    const role = session?.user?.role
    
    switch (role) {
      case UserRole.ADMIN:
        return [
          { href: "/admin", label: "Dashboard", icon: Home },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/vehicles", label: "Vehicles", icon: Truck },
          { href: "/admin/pricing", label: "Pricing", icon: Calculator },
          { href: "/admin/subscriptions", label: "Subscriptions", icon: FileText },
          { href: "/admin/reports", label: "Reports", icon: Calculator },
          { href: "/admin/settings", label: "Settings", icon: Settings },
        ]
      
      case UserRole.DRIVER:
        return [
          { href: "/driver", label: "Dashboard", icon: Home },
          { href: "/driver/trips", label: "My Trips", icon: Truck },
          { href: "/driver/profile", label: "Profile", icon: Users },
        ]
      
      case UserRole.CUSTOMER:
        return [
          { href: "/customer", label: "Dashboard", icon: Home },
          { href: "/customer/book-trip", label: "Book Trip", icon: Truck },
          { href: "/customer/my-trips", label: "My Trips", icon: FileText },
          { href: "/customer/invoices", label: "Invoices", icon: Calculator },
          { href: "/customer/profile", label: "Profile", icon: Users },
        ]
      
      case UserRole.ACCOUNTANT:
        return [
          { href: "/accountant", label: "Dashboard", icon: Home },
          { href: "/accountant/invoices", label: "Invoices", icon: FileText },
          { href: "/accountant/payments", label: "Payments", icon: Calculator },
          { href: "/accountant/reports", label: "Reports", icon: Calculator },
        ]
      
      case UserRole.CUSTOMS_BROKER:
        return [
          { href: "/customs-broker", label: "Dashboard", icon: Home },
          { href: "/customs-broker/shipments", label: "Shipments", icon: Truck },
          { href: "/customs-broker/fees", label: "Customs Fees", icon: Calculator },
        ]
      
      default:
        return []
    }
  }

  const navItems = getRoleBasedNavItems()

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "Administrator"
      case UserRole.DRIVER: return "Driver"
      case UserRole.CUSTOMER: return "Customer"
      case UserRole.ACCOUNTANT: return "Accountant"
      case UserRole.CUSTOMS_BROKER: return "Customs Broker"
      default: return role
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link href="/" className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-primary">PRO FLEET</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 ml-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b md:hidden">
            <div className="container px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent ${
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
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

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Search */}
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt={session?.user?.name} />
                  <AvatarFallback>
                    {session?.user?.name ? getInitials(session.user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.role && getRoleDisplayName(session.user.role)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  )
}