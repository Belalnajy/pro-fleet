"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import { UserRole } from "@prisma/client"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
  fallback?: React.ReactNode
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = "/auth/signin",
  fallback 
}: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'ar'

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push(redirectTo)
      return
    }

    if (!allowedRoles.includes(session.user.role)) {
      // Redirect user to their appropriate dashboard
      switch (session.user.role) {
        case UserRole.ADMIN:
          router.push(`/${locale}/admin`)
          break
        case UserRole.DRIVER:
          router.push(`/${locale}/driver`)
          break
        case UserRole.CUSTOMER:
          router.push(`/${locale}/customer`)
          break
        case UserRole.ACCOUNTANT:
          router.push(`/${locale}/accountant`)
          break
        case UserRole.CUSTOMS_BROKER:
          router.push(`/${locale}/customs-broker`)
          break
        default:
          router.push(`/${locale}`)
      }
    }
  }, [session, status, router, allowedRoles, redirectTo])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || !allowedRoles.includes(session.user.role)) {
    return fallback || null
  }

  return <>{children}</>
}