"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
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
  const params = useParams()
  const locale = params?.locale as string || 'ar'

  const getRoleBasedNavItems = () => {
    const role = session?.user?.role
    
    switch (role) {
      case UserRole.ADMIN:
        return [
          {
            title: "Dashboard",
            href: `/${locale}/admin`,
            icon: Home,
          },
          {
            title: "User Management",
            href: `/${locale}/admin/users`,
            icon: Users,
          },
          {
            title: "Vehicle Management",
            href: `/${locale}/admin/vehicles`,
            icon: Truck,
          },
          {
            title: "Pricing Management",
            href: `/${locale}/admin/pricing`,
            icon: Calculator,
          },
          {
            title: "Trip Management",
            href: `/${locale}/admin/trips`,
            icon: Package,
          },
          {
            title: "Subscription Plans",
            href: `/${locale}/admin/subscriptions`,
            icon: CreditCard,
          },
          {
            title: "Invoice Management",
            href: `/${locale}/admin/invoices`,
            icon: FileText,
          },
          {
            title: "Reports & Analytics",
            href: `/${locale}/admin/reports`,
            icon: BarChart3,
          },
          {
            title: "System Settings",
            href: `/${locale}/admin/settings`,
            icon: Settings,
          },

        ]
      
      case UserRole.DRIVER:
        return [
          {
            title: "Dashboard",
            href: `/${locale}/driver`,
            icon: Home,
          },
          {
            title: "My Trips",
            href: `/${locale}/driver/trips`,
            icon: Truck,
          },
          {
            title: "My Profile",
            href: `/${locale}/driver/profile`,
            icon: User,
          },
          {
            title: "Documents",
            href: `/${locale}/driver/documents`,
            icon: FileText,
          },
          {
            title: "Earnings",
            href: `/${locale}/driver/earnings`,
            icon: DollarSign,
          },
        ]
      
      case UserRole.CUSTOMER:
        return [
          {
            title: "Dashboard",
            href: `/${locale}/customer`,
            icon: Home,
          },
          {
            title: "Book New Trip",
            href: `/${locale}/customer/book-trip`,
            icon: Truck,
          },
          {
            title: "My Trips",
            href: `/${locale}/customer/my-trips`,
            icon: Package,
          },
          {
            title: "Invoices",
            href: `/${locale}/customer/invoices`,
            icon: FileText,
          },
          {
            title: "Payments",
            href: `/${locale}/customer/payments`,
            icon: CreditCard,
          },
          {
            title: "Tracking",
            href: `/${locale}/customer/tracking`,
            icon: FileSearch,
          },

        ]
      
      case UserRole.ACCOUNTANT:
        return [
          {
            title: "Dashboard",
            href: `/${locale}/accountant`,
            icon: Home,
          },
          {
            title: "Invoice Management",
            href: `/${locale}/accountant/invoices`,
            icon: FileText,
          },
          {
            title: "Payment Tracking",
            href: `/${locale}/accountant/payments`,
            icon: CreditCard,
          },
          {
            title: "Expense Management",
            href: `/${locale}/accountant/expenses`,
            icon: Calculator,
          },
          {
            title: "Financial Reports",
            href: `/${locale}/accountant/reports`,
            icon: BarChart3,
          },
          {
            title: "Tax Management",
            href: `/${locale}/accountant/tax`,
            icon: Calculator,
          },
        ]
      
      case UserRole.CUSTOMS_BROKER:
        return [
          {
            title: "Dashboard",
            href: `/${locale}/customs-broker`,
            icon: Home,
          },
          {
            title: "Shipments",
            href: `/${locale}/customs-broker/shipments`,
            icon: Package,
          },
          {
            title: "Customs Fees",
            href: `/${locale}/customs-broker/fees`,
            icon: Calculator,
          },
          {
            title: "Documentation",
            href: `/${locale}/customs-broker/documents`,
            icon: FileText,
          },
          {
            title: "Compliance",
            href: `/${locale}/customs-broker/compliance`,
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