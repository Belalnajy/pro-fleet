"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, use, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DocumentsManagement } from "@/components/customs/documents-management"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDocumentsManagementTranslation } from "@/hooks/useDocumentsManagementTranslation"

export default function DocumentsManagementPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { translate: translateDocs } = useDocumentsManagementTranslation()
  
  const [clearances, setClearances] = useState<any[]>([])
  const [selectedClearanceId, setSelectedClearanceId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      router.push(`/${locale}/auth/signin`)
    }
  }, [session, status, router, locale])

  useEffect(() => {
    if (session?.user.role === "CUSTOMS_BROKER") {
      fetchClearances()
    }
  }, [session])

  const fetchClearances = async () => {
    try {
      const response = await fetch('/api/customs-broker/clearances')
      if (response.ok) {
        const data = await response.json()
        setClearances(data.clearances || [])
      }
    } catch (error) {
      console.error('Error fetching clearances:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">{t("documentsManagement")}</h1>
          <p className="text-muted-foreground">
            {t("manageCustomsDocuments")}
          </p>
        </div>
        
        {clearances.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{translateDocs("noClearancesAvailableTitle")}</CardTitle>
              <CardDescription>
                {translateDocs("createClearanceFirstMessage")}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{translateDocs("selectClearanceTitle")}</CardTitle>
                <CardDescription>
                  {translateDocs("selectClearanceDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedClearanceId} onValueChange={setSelectedClearanceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={translateDocs("selectClearancePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {clearances.map((clearance) => (
                      <SelectItem key={clearance.id} value={clearance.id}>
                        {clearance.clearanceNumber} - {clearance.invoice?.trip?.customer?.name || translateDocs("unknownCustomerFallback")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedClearanceId && (
              <DocumentsManagement 
                clearanceId={selectedClearanceId} 
                clearanceNumber={clearances.find(c => c.id === selectedClearanceId)?.clearanceNumber || ''}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
