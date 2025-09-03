"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/providers/language-provider"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  FileText,
  DollarSign,
  Mail,
  Printer,
  Eye,
  Calculator,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send,
  CreditCard,
  BarChart3,
  TrendingUp,
  Users,
} from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  tripId?: string
  tripNumber?: string
  subtotal: number
  taxAmount: number
  customsFees: number
  totalAmount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  paidDate?: string
  createdAt: string
  updatedAt: string
}

interface Customer {
  id: string
  name: string
  email: string
  companyName?: string
}

interface Trip {
  id: string
  tripNumber: string
  fromCity: string
  toCity: string
}

export default function InvoicesManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: "",
    tripId: "",
    subtotal: "",
    taxAmount: "",
    customsFees: "",
    dueDate: "",
    notes: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      router.push("/auth/signin")
    } else {
      fetchInvoices()
      fetchCustomers()
      fetchTrips()
    }
  }, [session, status, router])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/admin/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/admin/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/admin/trips")
      if (response.ok) {
        const data = await response.json()
        setTrips(data)
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    }
  }

  const handleAddInvoice = async () => {
    try {
      const totalAmount = parseFloat(invoiceForm.subtotal) + 
                         parseFloat(invoiceForm.taxAmount) + 
                         parseFloat(invoiceForm.customsFees)
      
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          subtotal: parseFloat(invoiceForm.subtotal),
          taxAmount: parseFloat(invoiceForm.taxAmount),
          customsFees: parseFloat(invoiceForm.customsFees),
          totalAmount,
        }),
      })
      
      if (response.ok) {
        fetchInvoices()
        setIsAddInvoiceOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Error adding invoice:", error)
    }
  }

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return
    
    try {
      const totalAmount = parseFloat(invoiceForm.subtotal) + 
                         parseFloat(invoiceForm.taxAmount) + 
                         parseFloat(invoiceForm.customsFees)
      
      const response = await fetch(`/api/admin/invoices/${editingInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          subtotal: parseFloat(invoiceForm.subtotal),
          taxAmount: parseFloat(invoiceForm.taxAmount),
          customsFees: parseFloat(invoiceForm.customsFees),
          totalAmount,
        }),
      })
      
      if (response.ok) {
        fetchInvoices()
        setEditingInvoice(null)
        resetForm()
        setIsAddInvoiceOpen(false)
      }
    } catch (error) {
      console.error("Error updating invoice:", error)
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    if (confirm(t("confirmDelete"))) {
      try {
        const response = await fetch(`/api/admin/invoices/${id}`, {
          method: "DELETE",
        })
        
        if (response.ok) {
          fetchInvoices()
        }
      } catch (error) {
        console.error("Error deleting invoice:", error)
      }
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setInvoiceForm({
      customerId: invoice.customerId,
      tripId: invoice.tripId || "",
      subtotal: invoice.subtotal.toString(),
      taxAmount: invoice.taxAmount.toString(),
      customsFees: invoice.customsFees.toString(),
      dueDate: invoice.dueDate.split('T')[0],
      notes: "",
    })
    setIsAddInvoiceOpen(true)
  }

  const resetForm = () => {
    setInvoiceForm({
      customerId: "",
      tripId: "",
      subtotal: "",
      taxAmount: "",
      customsFees: "",
      dueDate: "",
      notes: "",
    })
  }

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  const handleSendEmail = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/send-email`, {
        method: "POST",
      })
      
      if (response.ok) {
        alert(("emailSentSuccessfully"))
      }
    } catch (error) {
      console.error("Error sending email:", error)
    }
  }

  const handleExportExcel = () => {
    // TODO: Implement Excel export functionality
    console.log("Export Excel functionality")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: "bg-gray-500", text: t("draft") },
      SENT: { color: "bg-blue-500", text: t("sent") },
      PAID: { color: "bg-green-500", text: t("paid") },
      OVERDUE: { color: "bg-red-500", text: t("overdue") },
      CANCELLED: { color: "bg-gray-400", text: t("cancelled") },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    )
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.tripNumber && invoice.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesCustomer = customerFilter === "all" || invoice.customerId === customerFilter
    
    return matchesSearch && matchesStatus && matchesCustomer
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t("loading")}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("invoiceManagement")}</h1>
            <p className="text-muted-foreground">{t("manageInvoicesAndBilling")}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              {t("exportExcel")}
            </Button>
            <Dialog open={isAddInvoiceOpen} onOpenChange={setIsAddInvoiceOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createInvoice")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingInvoice ? t("editInvoice") : t("createNewInvoice")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("invoiceDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">{t("customer")}</Label>
                    <Select
                      value={invoiceForm.customerId}
                      onValueChange={(value) => setInvoiceForm({...invoiceForm, customerId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectCustomer")} />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.companyName || customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="trip">{t("relatedTrip")} ({t("optional")})</Label>
                    <Select
                      value={invoiceForm.tripId}
                      onValueChange={(value) => setInvoiceForm({...invoiceForm, tripId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectTrip")} />
                      </SelectTrigger>
                      <SelectContent>
                        {trips.map((trip) => (
                          <SelectItem key={trip.id} value={trip.id}>
                            {trip.tripNumber} - {trip.fromCity} → {trip.toCity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subtotal">{t("subtotal")}</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      step="0.01"
                      value={invoiceForm.subtotal}
                      onChange={(e) => setInvoiceForm({...invoiceForm, subtotal: e.target.value})}
                      placeholder={t("enterSubtotal")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxAmount">{t("taxAmount")}</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      step="0.01"
                      value={invoiceForm.taxAmount}
                      onChange={(e) => setInvoiceForm({...invoiceForm, taxAmount: e.target.value})}
                      placeholder={t("enterTaxAmount")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customsFees">{t("customsFees")}</Label>
                    <Input
                      id="customsFees"
                      type="number"
                      step="0.01"
                      value={invoiceForm.customsFees}
                      onChange={(e) => setInvoiceForm({...invoiceForm, customsFees: e.target.value})}
                      placeholder={t("enterCustomsFees")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">{t("dueDate")}</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">{t("notes")} ({t("optional")})</Label>
                    <Textarea
                      id="notes"
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                      placeholder={t("enterNotes")}
                    />
                  </div>
                  <div className="col-span-2 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{t("totalAmount")}:</span>
                      <span className="text-lg font-bold">
                        {(parseFloat(invoiceForm.subtotal || "0") + 
                          parseFloat(invoiceForm.taxAmount || "0") + 
                          parseFloat(invoiceForm.customsFees || "0")).toFixed(2)} {t("currency")}
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsAddInvoiceOpen(false)
                    setEditingInvoice(null)
                    resetForm()
                  }}>
                    {t("cancel")}
                  </Button>
                  <Button onClick={editingInvoice ? handleUpdateInvoice : handleAddInvoice}>
                    {editingInvoice ? t("updateInvoice") : t("createInvoice")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalInvoices")}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("paidInvoices")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'PAID').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("overdueInvoices")}</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {invoices.filter(inv => inv.status === 'OVERDUE').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'PAID')
                  .reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)} {t("currency")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>{t("invoices")}</CardTitle>
            <CardDescription>{t("manageAllInvoices")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchInvoices")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                  <SelectItem value="SENT">{t("sent")}</SelectItem>
                  <SelectItem value="PAID">{t("paid")}</SelectItem>
                  <SelectItem value="OVERDUE">{t("overdue")}</SelectItem>
                  <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t("filterByCustomer")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCustomers")}</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.companyName || customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invoices Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{t("trip")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("dueDate")}</TableHead>
                  <TableHead>{t("createdAt")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.customerName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.tripNumber ? (
                        <Badge variant="outline">{invoice.tripNumber}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {invoice.totalAmount.toFixed(2)} {t("currency")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("tax")}: {invoice.taxAmount.toFixed(2)} | {t("customs")}: {invoice.customsFees.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleSendEmail(invoice.id)}>
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(invoice)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredInvoices.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">{t("noInvoicesFound")}</h3>
                <p className="text-muted-foreground">{t("noInvoicesDescription")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
