"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PaymentManagement } from "@/components/invoices/payment-management"
import {
  CreditCard,
  ArrowLeft,
  Search,
  FileText,
  DollarSign,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
  Eye,
  MapPin
} from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceType?: 'REGULAR' | 'CLEARANCE'
  tripNumber?: string
  route?: {
    from: string
    to: string
  }
  total: number
  amountPaid: number
  remainingAmount: number
  paymentStatus: string
  dueDate?: string
  installmentCount?: number
  installmentsPaid: number
  installmentAmount?: number
  nextInstallmentDate?: string
  payments?: any[]
  customsBroker?: {
    name: string
  }
}

export default function RecordPaymentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Get invoice from URL params if provided
  const invoiceId = searchParams.get('invoiceId')
  const invoiceType = searchParams.get('type') as 'regular' | 'clearance' | undefined

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user) {
      router.push(`/${locale}/auth/signin`)
      return
    }
    if (session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/unauthorized`)
      return
    }
    
    fetchInvoices()
  }, [status, session, locale, router])

  useEffect(() => {
    if (invoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === invoiceId)
      if (invoice) {
        setSelectedInvoice(invoice)
      }
    }
  }, [invoiceId, invoices])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      
      // Fetch regular invoices
      const regularResponse = await fetch('/api/customer/invoices')
      const regularData = regularResponse.ok ? await regularResponse.json() : []
      
      // Fetch clearance invoices
      const clearanceResponse = await fetch('/api/customer/clearance-invoices')
      const clearanceData = clearanceResponse.ok ? await clearanceResponse.json() : []
      
      // Combine and filter unpaid invoices
      const regularInvoices = (Array.isArray(regularData) ? regularData : []).map((inv: any) => ({ 
        ...inv, 
        invoiceType: 'REGULAR' as const,
        total: inv.totalAmount || inv.total || 0,
        tripNumber: inv.tripNumber || inv.trip?.tripNumber || 'N/A',
        route: inv.trip ? {
          from: inv.trip.fromCity || 'N/A',
          to: inv.trip.toCity || 'N/A'
        } : undefined
      }))
      const clearanceInvoices = (Array.isArray(clearanceData) ? clearanceData : []).map((inv: any) => ({ 
        ...inv, 
        invoiceType: 'CLEARANCE' as const,
        total: inv.totalAmount || inv.total || 0,
        tripNumber: inv.tripNumber || inv.trip?.tripNumber || 'N/A',
        route: inv.trip ? {
          from: inv.trip.fromCity || 'N/A',
          to: inv.trip.toCity || 'N/A'
        } : undefined
      }))
      
      const allInvoices = [...regularInvoices, ...clearanceInvoices]
        .filter(inv => inv.remainingAmount > 0)
      
      setInvoices(allInvoices)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({
        title: "خطأ",
        description: "فشل في جلب الفواتير",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentAdded = (updatedInvoice: Invoice) => {
    // Update the invoice in the list
    setInvoices(prev => prev.map(inv => 
      inv.id === updatedInvoice.id ? updatedInvoice : inv
    ))
    
    // If remaining amount is 0, remove from list
    if (updatedInvoice.remainingAmount <= 0) {
      setInvoices(prev => prev.filter(inv => inv.id !== updatedInvoice.id))
      setSelectedInvoice(null)
    } else {
      setSelectedInvoice(updatedInvoice)
    }
    
    toast({
      title: "تم بنجاح",
      description: "تم تسجيل الدفعة بنجاح",
    })
  }

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.tripNumber && invoice.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'PENDING': { label: 'معلقة', variant: 'secondary' as const },
      'PAID': { label: 'مدفوعة', variant: 'default' as const },
      'OVERDUE': { label: 'متأخرة', variant: 'destructive' as const },
      'INSTALLMENT': { label: 'أقساط', variant: 'outline' as const },
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getInvoiceTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'REGULAR' ? 'default' : 'secondary'}>
        {type === 'REGULAR' ? 'فاتورة عادية' : 'تخليص جمركي'}
      </Badge>
    )
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout
        title="تسجيل دفعة"
        subtitle="جاري التحميل..."
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  // If an invoice is selected, show the invoice details and payment management
  if (selectedInvoice) {
    return (
      <DashboardLayout
        title={`الفاتورة ${selectedInvoice.invoiceNumber}`}
        subtitle={`إدارة مدفوعات ${selectedInvoice.invoiceType === 'CLEARANCE' ? 'فاتورة التخليص الجمركي' : 'الفاتورة العادية'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setSelectedInvoice(null)} 
              variant="outline" 
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة للقائمة
            </Button>
            <Button onClick={() => router.back()} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              رجوع
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                تفاصيل الفاتورة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">رقم الفاتورة</Label>
                    <p className="text-lg font-semibold">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  
                  {selectedInvoice.tripNumber && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">رقم الرحلة</Label>
                      <p className="font-medium">{selectedInvoice.tripNumber}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">نوع الفاتورة</Label>
                    <div className="mt-1">
                      {getInvoiceTypeBadge(selectedInvoice.invoiceType || 'REGULAR')}
                    </div>
                  </div>
                </div>

                {/* Route Info */}
                {selectedInvoice.route && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">المسار</Label>
                      <p className="font-medium">{selectedInvoice.route.from} ← {selectedInvoice.route.to}</p>
                    </div>
                    
                    {selectedInvoice.customsBroker && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">المخلص الجمركي</Label>
                        <p className="font-medium">{selectedInvoice.customsBroker.name}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Financial Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">الحالة</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedInvoice.paymentStatus)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">الإجمالي:</span>
                      <span className="font-semibold">{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">المدفوع:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(selectedInvoice.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">المتبقي:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(selectedInvoice.remainingAmount)}</span>
                    </div>
                    
                    {selectedInvoice.installmentCount && selectedInvoice.installmentCount > 0 && (
                      <>
                        <div className="flex justify-between text-purple-600">
                          <span className="text-sm">الأقساط:</span>
                          <span className="font-medium">{selectedInvoice.installmentsPaid}/{selectedInvoice.installmentCount}</span>
                        </div>
                        {selectedInvoice.installmentAmount && (
                          <div className="flex justify-between text-purple-600">
                            <span className="text-sm">قيمة القسط:</span>
                            <span className="font-medium">{formatCurrency(selectedInvoice.installmentAmount)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Management */}
          <PaymentManagement
            key={selectedInvoice.id} // Force re-mount when invoice changes
            invoice={selectedInvoice}
            onPaymentAdded={(updatedInvoice) => {
              // Update the selected invoice
              setSelectedInvoice(updatedInvoice)
              // Update in the invoices list
              setInvoices(prev => prev.map(inv => 
                inv.id === updatedInvoice.id ? updatedInvoice : inv
              ))
              
              // If fully paid, show success message and option to go back
              if (updatedInvoice.remainingAmount <= 0) {
                toast({
                  title: "تم الدفع بالكامل",
                  description: "تم دفع الفاتورة بالكامل بنجاح",
                })
                // Remove from list since it's fully paid
                setInvoices(prev => prev.filter(inv => inv.id !== updatedInvoice.id))
              } else {
                toast({
                  title: "تم بنجاح",
                  description: "تم تسجيل الدفعة بنجاح",
                })
              }
            }}
            apiEndpoint={selectedInvoice.invoiceType === 'CLEARANCE' 
              ? "/api/customer/clearance-invoices" 
              : "/api/customer/invoices"
            }
          />
        </div>
      </DashboardLayout>
    )
  }

  // Show invoice selection list
  return (
    <DashboardLayout
      title="تسجيل دفعة"
      subtitle="اختر الفاتورة التي تريد تسجيل دفعة لها"
      actions={
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          رجوع
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            الفواتير المتاحة للدفع
          </CardTitle>
          <CardDescription>
            اختر الفاتورة التي تريد تسجيل دفعة لها
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث برقم الفاتورة أو الرحلة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Invoice List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد فواتير متاحة للدفع</h3>
                <p>جميع فواتيرك مدفوعة بالكامل أو لا توجد فواتير</p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <Card 
                  key={invoice.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                      {getStatusBadge(invoice.paymentStatus)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getInvoiceTypeBadge(invoice.invoiceType || 'REGULAR')}
                      {invoice.installmentCount && invoice.installmentCount > 0 && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          <Calendar className="h-3 w-3 mr-1" />
                          {invoice.installmentsPaid}/{invoice.installmentCount} أقساط
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {invoice.tripNumber && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>رحلة: {invoice.tripNumber}</span>
                      </div>
                    )}
                    
                    {invoice.route && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{invoice.route.from} ← {invoice.route.to}</span>
                      </div>
                    )}
                    
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الإجمالي:</span>
                        <span className="font-medium">{formatCurrency(invoice.total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المدفوع:</span>
                        <span className="font-medium text-green-600">{formatCurrency(invoice.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المتبقي:</span>
                        <span className="font-semibold text-orange-600">{formatCurrency(invoice.remainingAmount)}</span>
                      </div>
                      {invoice.installmentAmount && (
                        <div className="flex justify-between text-sm text-purple-600">
                          <span>قيمة القسط:</span>
                          <span className="font-medium">{formatCurrency(invoice.installmentAmount)}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button className="w-full mt-4" size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      تسجيل دفعة
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
