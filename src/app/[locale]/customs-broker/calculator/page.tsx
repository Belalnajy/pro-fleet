"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FeeCalculator } from "@/components/customs/fee-calculator"
import { useLanguage } from "@/components/providers/language-provider"

export default function FeeCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      router.push(`/${locale}/auth/signin`)
    }
  }, [session, status, router, locale])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session || session.user.role !== "CUSTOMS_BROKER") {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("calculator")}</h1>
          <p className="text-muted-foreground">
            احسب الرسوم الجمركية المطلوبة للبضائع
          </p>
        </div>
        
        <FeeCalculator />
      </div>
    </DashboardLayout>
  )
}
