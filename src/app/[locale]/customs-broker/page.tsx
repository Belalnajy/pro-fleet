"use client"

import "@/styles/customs-broker-responsive.css"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, use, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useLanguage } from "@/components/providers/language-provider"


import {
  FileText,
  DollarSign,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  Download,
  Ship,
  Package,
  Edit,
  Save,
  Loader2,
  BarChart3,
} from "lucide-react"

export default function CustomsBrokerDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [editingFees, setEditingFees] = useState(0)
  const [selectedClearance, setSelectedClearance] = useState<any>(null)
  const [editForm, setEditForm] = useState({ customsFee: '', notes: '' })
  const [updating, setUpdating] = useState(false)
  
  // Modal states
  const [viewInvoiceModal, setViewInvoiceModal] = useState<any>(null)
  


  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      router.push(`/${locale}/auth/signin`)
    }
  }, [session, status, router, locale])

  // Fetch dashboard data
  useEffect(() => {
    if (session?.user.role === "CUSTOMS_BROKER") {
      fetchDashboardData()
      fetchInvoices()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/customs-broker/dashboard')
      if (response.ok) {
        const data = await response.json()

        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/customs-broker/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice.id)
    setEditForm({
      customsFee: invoice.customsFee?.toString() || '',
      notes: invoice.notes || ''
    })
  }

  const handleSaveInvoice = async (invoiceId: string) => {
    if (!editForm.customsFee || parseFloat(editForm.customsFee) < 0) {
      toast.error(t("pleaseEnterValidCustomsFee"))
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/customs-broker/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customsFee: parseFloat(editForm.customsFee),
          notes: editForm.notes
        })
      })

      if (response.ok) {
        toast.success(t("customsFeeUpdatedSuccessfully"))
        setEditingInvoice(null)
        setEditForm({ customsFee: '', notes: '' })
        fetchInvoices()
      } else {
        toast.error(t("failedToUpdateInvoice"))
      }
    } catch (error) {
      toast.error(t("failedToUpdateInvoice"))
    } finally {
      setUpdating(false)
    }
  }

  const handleViewInvoice = (invoice: any) => {
    setViewInvoiceModal(invoice)
  }

  const handleGenerateDocs = (invoice: any) => {
    toast.success(`${t("clearanceDocumentsGenerated")} ${invoice.invoiceNumber}`, {
      description: t("documentsWillBeSentByEmail")
    })
  }

  const cancelEdit = () => {
    setEditingInvoice(null)
    setEditForm({ customsFee: '', notes: '' })
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout title={t("customsBrokerDashboard")} subtitle="">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== "CUSTOMS_BROKER") {
    return null
  }

  // Use real data from API
  const brokerInfo = {
    name: dashboardData?.brokerInfo?.name || session.user.name || "مخلص جمركي",
    licenseNumber: dashboardData?.brokerInfo?.licenseNumber || "CB-2024-001",
    email: dashboardData?.brokerInfo?.email || session.user.email,
    phone: dashboardData?.brokerInfo?.phone || "غير محدد",
    totalInvoices: dashboardData?.statistics?.totalInvoices || 0,
    totalClearances: dashboardData?.statistics?.totalClearances || 0,
    pendingClearances: dashboardData?.statistics?.pendingClearances || 0,
    completedClearances: dashboardData?.statistics?.completedClearances || 0,
    totalFees: dashboardData?.statistics?.totalFees || 0,
    averageProcessingTime: dashboardData?.statistics?.averageProcessingTime || "N/A",
    successRate: dashboardData?.statistics?.successRate || "N/A",
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "SENT":
        return "bg-blue-100 text-blue-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "OVERDUE":
        return "bg-red-100 text-red-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4" />
      case "SENT":
        return <Clock className="h-4 w-4" />
      case "PENDING":
        return <AlertTriangle className="h-4 w-4" />
      case "OVERDUE":
        return <AlertTriangle className="h-4 w-4" />
      case "CANCELLED":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }





  return (
    <DashboardLayout
      title={t("customsBrokerDashboard")}
      subtitle={`${t("welcomeBack")}, ${brokerInfo.name}!`}
    >
          {/* Broker Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("brokerInfo")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("customer")}</label>
                  <p className="font-semibold">{brokerInfo.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("licenseNumber")}</label>
                  <p className="font-semibold">{brokerInfo.licenseNumber}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("totalInvoices")}</label>
                  <p className="font-semibold">{brokerInfo.totalInvoices}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("successRate")}</label>
                  <p className="font-semibold">{brokerInfo.successRate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 customs-stats-grid">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalInvoices")}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{brokerInfo.totalInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  {t("totalShipmentsHandled")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("pendingClearances")}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{brokerInfo.pendingClearances}</div>
                <p className="text-xs text-muted-foreground">
                  {t("awaitingProcessing")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("completedClearances")}</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{brokerInfo.completedClearances}</div>
                <p className="text-xs text-muted-foreground">
                  {t("successfullyProcessed")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalFees")}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{brokerInfo.totalFees.toLocaleString()} {t("currency")}</div>
                <p className="text-xs text-muted-foreground">
                  {t("totalFeesCollected")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>{t("recentInvoices")}</CardTitle>
              <CardDescription>{t("recentInvoicesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("noInvoicesFound")}</p>
                  <p className="text-sm">{t("noInvoicesDescription")}</p>
                </div>
              ) : (
                invoices.map((invoice) => (
                  <div key={invoice.id} className="p-3 sm:p-4 border rounded-lg space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="font-semibold text-sm">
                          {t("trip")}: {invoice.tripNumber || invoice.invoiceNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.route?.from} {t("to")} {invoice.route?.to}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.customer?.name || t("unknownCustomer")}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs self-start">
                        {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                      </Badge>
                    </div>

                    {editingInvoice === invoice.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`customsFee-${invoice.id}`} className="text-sm">
                              {t("customsFee")} ({t("currency")})
                            </Label>
                            <Input
                              id={`customsFee-${invoice.id}`}
                              type="number"
                              value={editForm.customsFee}
                              onChange={(e) => setEditForm(prev => ({ ...prev, customsFee: e.target.value }))}
                              placeholder="0.00"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`notes-${invoice.id}`} className="text-sm">
                              {t("notes")}
                            </Label>
                            <Textarea
                              id={`notes-${invoice.id}`}
                              value={editForm.notes}
                              onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder={t("enterNotes")}
                              className="text-sm min-h-[60px]"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={cancelEdit} className="w-full sm:w-auto">
                            {t("cancel")}
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveInvoice(invoice.id)}
                            disabled={updating}
                            className="w-full sm:w-auto"
                          >
                            {updating ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            {t("saveChanges")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            {invoice.customsFee > 0 ? `${invoice.customsFee} ${t("currency")}` : t("notCalculated")}
                          </div>
                          <Badge className={getStatusColor(invoice.paymentStatus)}>
                            {getStatusIcon(invoice.paymentStatus)}
                            <span className="mr-1">{t(invoice.paymentStatus)}</span>
                          </Badge>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 sm:gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)} className="flex-1 sm:flex-none">
                            <Eye className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">{t("view")}</span>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice)} className="flex-1 sm:flex-none">
                            <Edit className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">{invoice.customsFee > 0 ? t("editCustomsFee") : t("calculate")}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t("quickActions")}</CardTitle>
              <CardDescription>{t("commonCustomsBrokerTasks")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 customs-quick-actions">
                <Button className="h-16 sm:h-20 flex-col p-2 sm:p-4 customs-quick-action-btn" variant="outline" onClick={() => router.push(`/${locale}/customs-broker/clearances`)}>
                  <Plus className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm text-center">{t("newClearance")}</span>
                </Button>
                <Button className="h-16 sm:h-20 flex-col p-2 sm:p-4 customs-quick-action-btn" variant="outline" onClick={() => router.push(`/${locale}/customs-broker/calculator`)}>
                  <Calculator className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm text-center">{t("calculateFees")}</span>
                </Button>
                <Button className="h-16 sm:h-20 flex-col p-2 sm:p-4 customs-quick-action-btn" variant="outline" onClick={() => router.push(`/${locale}/customs-broker/documents`)}>
                  <FileText className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm text-center">{t("generateDocs")}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* View Invoice Modal */}
      {viewInvoiceModal && (
        <Dialog open={!!viewInvoiceModal} onOpenChange={() => setViewInvoiceModal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("invoiceDetails")}</DialogTitle>
              <DialogDescription>
                {t("viewInvoiceInformation")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("invoiceNumber")}</label>
                  <p className="font-semibold">{viewInvoiceModal.invoiceNumber}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("customer")}</label>
                  <p className="font-semibold">{viewInvoiceModal.customer?.name || t("unknownCustomer")}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("route")}</label>
                  <p className="font-semibold">{viewInvoiceModal.route?.from} {t("to")} {viewInvoiceModal.route?.to}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("status")}</label>
                  <Badge className={getStatusColor(viewInvoiceModal.paymentStatus)}>
                    {getStatusIcon(viewInvoiceModal.paymentStatus)}
                    <span className="mr-1">{t(viewInvoiceModal.paymentStatus)}</span>
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("customsFee")}</label>
                  <p className="font-semibold">
                    {viewInvoiceModal.customsFee > 0 ? `${viewInvoiceModal.customsFee} ${t("currency")}` : t("notCalculated")}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("createdAt")}</label>
                  <p className="font-semibold">{new Date(viewInvoiceModal.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
              {viewInvoiceModal.notes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("notes")}</label>
                  <p className="text-sm bg-muted p-3 rounded">{viewInvoiceModal.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
     </DashboardLayout>
  )
}
