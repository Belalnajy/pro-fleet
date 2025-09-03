"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Home, 
  Truck, 
  Users, 
  Calculator, 
  FileText, 
  Settings,
  BarChart3,
  Package,
  CreditCard,
  FileSearch,
  DollarSign,
  Wrench,
  User,
  LogOut
} from "lucide-react"
import { UserRole } from "@prisma/client"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const getRoleBasedNavItems = () => {
    const role = session?.user?.role
    
    switch (role) {
      case UserRole.ADMIN:
        return [
          {
            title: "Dashboard",
            href: "/admin",
            icon: Home,
          },
          {
            title: "User Management",
            href: "/admin/users",
            icon: Users,
          },
          {
            title: "Vehicle Management",
            href: "/admin/vehicles",
            icon: Truck,
          },
          {
            title: "Pricing Management",
            href: "/admin/pricing",
            icon: Calculator,
          },
          {
            title: "Trip Management",
            href: "/admin/trips",
            icon: Package,
          },
          {
            title: "Subscription Plans",
            href: "/admin/subscriptions",
            icon: CreditCard,
          },
          {
            title: "Invoice Management",
            href: "/admin/invoices",
            icon: FileText,
          },
          {
            title: "Reports & Analytics",
            href: "/admin/reports",
            icon: BarChart3,
          },
          {
            title: "System Settings",
            href: "/admin/settings",
            icon: Settings,
          },
        ]
      
      case UserRole.DRIVER:
        return [
          {
            title: "Dashboard",
            href: "/driver",
            icon: Home,
          },
          {
            title: "My Trips",
            href: "/driver/trips",
            icon: Truck,
          },
          {
            title: "My Profile",
            href: "/driver/profile",
            icon: User,
          },
          {
            title: "Documents",
            href: "/driver/documents",
            icon: FileText,
          },
          {
            title: "Earnings",
            href: "/driver/earnings",
            icon: DollarSign,
          },
        ]
      
      case UserRole.CUSTOMER:
        return [
          {
            title: "Dashboard",
            href: "/customer",
            icon: Home,
          },
          {
            title: "Book New Trip",
            href: "/customer/book-trip",
            icon: Truck,
          },
          {
            title: "My Trips",
            href: "/customer/my-trips",
            icon: Package,
          },
          {
            title: "Invoices & Payments",
            href: "/customer/invoices",
            icon: FileText,
          },
          {
            title: "Tracking",
            href: "/customer/tracking",
            icon: FileSearch,
          },
          {
            title: "My Profile",
            href: "/customer/profile",
            icon: User,
          },
        ]
      
      case UserRole.ACCOUNTANT:
        return [
          {
            title: "Dashboard",
            href: "/accountant",
            icon: Home,
          },
          {
            title: "Invoice Management",
            href: "/accountant/invoices",
            icon: FileText,
          },
          {
            title: "Payment Tracking",
            href: "/accountant/payments",
            icon: CreditCard,
          },
          {
            title: "Expense Management",
            href: "/accountant/expenses",
            icon: Calculator,
          },
          {
            title: "Financial Reports",
            href: "/accountant/reports",
            icon: BarChart3,
          },
          {
            title: "Tax Management",
            href: "/accountant/tax",
            icon: Calculator,
          },
        ]
      
      case UserRole.CUSTOMS_BROKER:
        return [
          {
            title: "Dashboard",
            href: "/customs-broker",
            icon: Home,
          },
          {
            title: "Shipments",
            href: "/customs-broker/shipments",
            icon: Package,
          },
          {
            title: "Customs Fees",
            href: "/customs-broker/fees",
            icon: Calculator,
          },
          {
            title: "Documentation",
            href: "/customs-broker/documents",
            icon: FileText,
          },
          {
            title: "Compliance",
            href: "/customs-broker/compliance",
            icon: FileSearch,
          },
        ]
      
      default:
        return []
    }
  }

  const navItems = getRoleBasedNavItems()

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-6">
            <Truck className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-primary">PRO FLEET</h2>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}