"use client"

import { useState, useEffect } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { useLanguage } from "@/components/providers/language-provider"
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  SaudiRiyal,
  Package,
  Loader2,
} from "lucide-react"

interface ClearanceManagementProps {
  customsBrokerId: string
}

export function ClearanceManagement({ customsBrokerId }: ClearanceManagementProps) {
  const { t } = useLanguage()
  const [clearances, setClearances] = useState<any[]>([])
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [selectedClearance, setSelectedClearance] = useState<any>(null)
  const [newClearanceModal, setNewClearanceModal] = useState(false)
  const [editClearanceModal, setEditClearanceModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [newClearanceForm, setNewClearanceForm] = useState({
    invoiceId: '',
    customsFee: '',
    additionalFees: '',
    notes: '',
    estimatedCompletionDate: '',
    // New fields for percentage-based calculations
    customsFeeType: 'FIXED', // 'FIXED' or 'PERCENTAGE'
    customsFeePercentage: '',
    additionalFeesType: 'FIXED', // 'FIXED' or 'PERCENTAGE' 
    additionalFeesPercentage: ''
  })

  const [editForm, setEditForm] = useState({
    status: '',
    customsFee: '',
    additionalFees: '',
    notes: '',
    estimatedCompletionDate: '',
    actualCompletionDate: ''
  })

  useEffect(() => {
    console.log('Fetching clearances with:', { statusFilter, page, customsBrokerId })
    fetchClearances()
    fetchAvailableInvoices()
  }, [statusFilter, page, customsBrokerId])

  useEffect(() => {
    console.log('availableInvoices state updated:', availableInvoices)
  }, [availableInvoices])

  const fetchAvailableInvoices = async () => {
    try {
      setLoadingInvoices(true)
      console.log('Fetching available invoices...')
      const response = await fetch('/api/customs-broker/invoices')
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Invoices data:', data)
        console.log('Invoices array:', data.invoices)
        console.log('Invoices length:', data.invoices?.length || 0)
        setAvailableInvoices(data.invoices || [])
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        toast.error(errorData.error || t('failedToLoadInvoices'))
      }
    } catch (error) {
      console.error('Error fetching available invoices:', error)
      toast.error(t('failedToLoadInvoices'))
    } finally {
      setLoadingInvoices(false)
    }
  }

  const fetchClearances = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/customs-broker/clearances?${params}`)
      console.log('Clearances API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Clearances API data:', data)
        console.log('Clearances array:', data.clearances)
        console.log('Clearances count:', data.clearances?.length || 0)
        setClearances(data.clearances || [])
        setTotalPages(data.pagination?.pages || 1)
      } else {
        const errorData = await response.json()
        console.error('Clearances API Error:', errorData)
        toast.error(errorData.error || t('failedToLoadClearances'))
      }
    } catch (error) {
      console.error('Error fetching clearances:', error)
      toast.error(t('failedToLoadClearances'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClearance = async () => {
    try {
      // Validate required fields based on fee type
      const customsFeeValue = newClearanceForm.customsFeeType === 'FIXED' 
        ? newClearanceForm.customsFee 
        : newClearanceForm.customsFeePercentage
      
      if (!newClearanceForm.invoiceId || !customsFeeValue) {
        toast.error(t('fillAllRequiredFields'))
        return
      }

      const response = await fetch('/api/customs-broker/clearances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: newClearanceForm.invoiceId,
          notes: newClearanceForm.notes,
          estimatedCompletionDate: newClearanceForm.estimatedCompletionDate,
          // Customs fee data
          customsFeeType: newClearanceForm.customsFeeType,
          customsFee: newClearanceForm.customsFeeType === 'FIXED' 
            ? parseFloat(newClearanceForm.customsFee) 
            : 0,
          customsFeePercentage: newClearanceForm.customsFeeType === 'PERCENTAGE' 
            ? parseFloat(newClearanceForm.customsFeePercentage) 
            : 0,
          // Additional fees data
          additionalFeesType: newClearanceForm.additionalFeesType,
          additionalFees: newClearanceForm.additionalFeesType === 'FIXED' 
            ? (parseFloat(newClearanceForm.additionalFees) || 0) 
            : 0,
          additionalFeesPercentage: newClearanceForm.additionalFeesType === 'PERCENTAGE' 
            ? (parseFloat(newClearanceForm.additionalFeesPercentage) || 0) 
            : 0
        }),
      })

      if (response.ok) {
        toast.success(t('clearanceCreatedSuccessfully'))
        setNewClearanceModal(false)
        setNewClearanceForm({
          invoiceId: '',
          customsFee: '',
          additionalFees: '',
          notes: '',
          estimatedCompletionDate: '',
          customsFeeType: 'FIXED',
          customsFeePercentage: '',
          additionalFeesType: 'FIXED',
          additionalFeesPercentage: ''
        })
        fetchClearances()
      } else {
        const error = await response.json()
        toast.error(error.error || t('failedToCreateClearance'))
      }
    } catch (error) {
      console.error('Error creating clearance:', error)
      toast.error(t('errorCreatingClearance'))
    }
  }

  const handleUpdateClearance = async () => {
    try {
      if (!selectedClearance) return

      const response = await fetch(`/api/customs-broker/clearances/${selectedClearance.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          customsFee: editForm.customsFee ? parseFloat(editForm.customsFee) : undefined,
          additionalFees: editForm.additionalFees ? parseFloat(editForm.additionalFees) : undefined
        }),
      })

      if (response.ok) {
        toast.success(t('clearanceUpdatedSuccessfully'))
        setEditClearanceModal(false)
        setSelectedClearance(null)
        fetchClearances()
      } else {
        const error = await response.json()
        toast.error(error.error || t('failedToUpdateClearance'))
      }
    } catch (error) {
      console.error('Error updating clearance:', error)
      toast.error(t('errorUpdatingClearance'))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'IN_REVIEW':
        return <AlertTriangle className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "delivered":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "PENDING":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "PAID":
      case "paid":
        return "bg-green-100 text-green-800"
      case "ASSIGNED":
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "IN_TRANSIT":
      case "inTransit":
        return "bg-yellow-100 text-yellow-800"
      case "OVERDUE":
      case "overdue":
        return "bg-red-100 text-red-800"
      case "IN_PROGRESS":
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "EN_ROUTE_PICKUP":
      case "enRoutePickup":
        return "bg-blue-100 text-blue-800"
      case "AT_PICKUP":
      case "atPickup":
        return "bg-blue-100 text-blue-800"
      case "PICKED_UP":
      case "pickedUp":
        return "bg-blue-100 text-blue-800"
      case "AT_DESTINATION":
      case "atDestination":
        return "bg-blue-100 text-blue-800"
      case "SENT":
      case "sent":
        return "bg-blue-100 text-blue-800"
        
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('pending')
      case 'IN_REVIEW':
        return t('inReview')
      case 'APPROVED':
        return t('approved')
      case 'REJECTED':
        return t('rejected')
      case 'COMPLETED':
        return t('completed')
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('allStatuses')}</SelectItem>
              <SelectItem value="PENDING">{t('pending')}</SelectItem>
              <SelectItem value="IN_REVIEW">{t('inReview')}</SelectItem>
              <SelectItem value="APPROVED">{t('approved')}</SelectItem>
              <SelectItem value="REJECTED">{t('rejected')}</SelectItem>
              <SelectItem value="COMPLETED">{t('completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={newClearanceModal} onOpenChange={setNewClearanceModal}>
          <DialogTrigger asChild>
            <Button className="mb-4">
              <Plus className="h-4 w-4 mr-2" />
              {t('newClearance')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('createNewClearance')}</DialogTitle>
              <DialogDescription>
                {t('createNewClearanceDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invoiceId">{t('selectInvoiceForClearance')}</Label>
                {loadingInvoices ? (
                  <div className="grid grid-cols-1 gap-4 py-4 border rounded">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('loadingInvoices')}
                  </div>
                ) : (
                  <Select value={newClearanceForm.invoiceId} onValueChange={(value) => setNewClearanceForm({ ...newClearanceForm, invoiceId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectInvoice')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInvoices.length === 0 ? (
                        <SelectItem value="no-invoices" disabled>{t('noInvoicesAvailable')}</SelectItem>
                      ) : (
                        availableInvoices.map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {invoice.customer.name} ({invoice.route.from} → {invoice.route.to})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label htmlFor="customsFee">{t('customsFeesSar')}</Label>
                <div className="space-y-2">
                  <Select value={newClearanceForm.customsFeeType} onValueChange={(value) => setNewClearanceForm({ ...newClearanceForm, customsFeeType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">{t('fixedAmount')}</SelectItem>
                      <SelectItem value="PERCENTAGE">{t('percentageAmount')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {newClearanceForm.customsFeeType === 'FIXED' ? (
                    <Input
                      id="customsFee"
                      type="number"
                      value={newClearanceForm.customsFee}
                      onChange={(e) => setNewClearanceForm({ ...newClearanceForm, customsFee: e.target.value })}
                      placeholder="0.00 ريال"
                    />
                  ) : (
                    <div className="space-y-1">
                      <Input
                        id="customsFeePercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={newClearanceForm.customsFeePercentage}
                        onChange={(e) => setNewClearanceForm({ ...newClearanceForm, customsFeePercentage: e.target.value })}
                        placeholder="0.0%"
                      />
                      {newClearanceForm.customsFeePercentage && availableInvoices.find(inv => inv.id === newClearanceForm.invoiceId) && (
                        <p className="text-sm text-muted-foreground">
                          المبلغ المحسوب: {((availableInvoices.find(inv => inv.id === newClearanceForm.invoiceId)?.total || 0) * parseFloat(newClearanceForm.customsFeePercentage)) / 100} ريال
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="additionalFees">{t('additionalFeesSar')}</Label>
                <div className="space-y-2">
                  <Select value={newClearanceForm.additionalFeesType} onValueChange={(value) => setNewClearanceForm({ ...newClearanceForm, additionalFeesType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">{t('fixedAmount')}</SelectItem>
                      <SelectItem value="PERCENTAGE">{t('percentageAmount')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {newClearanceForm.additionalFeesType === 'FIXED' ? (
                    <Input
                      id="additionalFees"
                      type="number"
                      value={newClearanceForm.additionalFees}
                      onChange={(e) => setNewClearanceForm({ ...newClearanceForm, additionalFees: e.target.value })}
                      placeholder="0.00 ريال"
                    />
                  ) : (
                    <div className="space-y-1">
                      <Input
                        id="additionalFeesPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={newClearanceForm.additionalFeesPercentage}
                        onChange={(e) => setNewClearanceForm({ ...newClearanceForm, additionalFeesPercentage: e.target.value })}
                        placeholder="0.0%"
                      />
                      {newClearanceForm.additionalFeesPercentage && availableInvoices.find(inv => inv.id === newClearanceForm.invoiceId) && (
                        <p className="text-sm text-muted-foreground">
                          المبلغ المحسوب: {((availableInvoices.find(inv => inv.id === newClearanceForm.invoiceId)?.total || 0) * parseFloat(newClearanceForm.additionalFeesPercentage)) / 100} ريال
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="estimatedDate">{t('estimatedCompletionDate')}</Label>
                <Input
                  id="estimatedDate"
                  type="date"
                  value={newClearanceForm.estimatedCompletionDate}
                  onChange={(e) => setNewClearanceForm({ ...newClearanceForm, estimatedCompletionDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">{t('notes')}</Label>
                <Textarea
                  id="notes"
                  value={newClearanceForm.notes}
                  onChange={(e) => setNewClearanceForm({ ...newClearanceForm, notes: e.target.value })}
                  placeholder={t('enterAdditionalNotes')}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateClearance} className="flex-1">
                  {t('create')}
                </Button>
                <Button variant="outline" onClick={() => setNewClearanceModal(false)} className="flex-1">
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clearances Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('clearanceOperations')}</CardTitle>
          <CardDescription>{t('manageClearanceOperations')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : clearances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noClearanceOperations')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clearanceNumber')}</TableHead>
                  <TableHead>{t('invoiceNumber')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('totalFees')}</TableHead>
                  <TableHead>{t('creationDate')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clearances.map((clearance) => (
                  <TableRow key={clearance.id}>
                    <TableCell className="font-medium">
                      {clearance.clearanceNumber}
                    </TableCell>
                    <TableCell>{clearance.invoice.invoiceNumber}</TableCell>
                    <TableCell>{clearance.invoice.trip.customer.name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(clearance.status)}>
                        {getStatusIcon(clearance.status)}
                        <span className="mr-1">{getStatusText(clearance.status)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {clearance.totalFees.toLocaleString()} {t('sar')}
                    </TableCell>
                    <TableCell>
                      {new Date(clearance.createdAt).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClearance(clearance)
                            setEditForm({
                              status: clearance.status,
                              customsFee: clearance.customsFee.toString(),
                              additionalFees: clearance.additionalFees.toString(),
                              notes: clearance.notes || '',
                              estimatedCompletionDate: clearance.estimatedCompletionDate 
                                ? new Date(clearance.estimatedCompletionDate).toISOString().split('T')[0] 
                                : '',
                              actualCompletionDate: clearance.actualCompletionDate 
                                ? new Date(clearance.actualCompletionDate).toISOString().split('T')[0] 
                                : ''
                            })
                            setEditClearanceModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Clearance Modal */}
      <Dialog open={editClearanceModal} onOpenChange={setEditClearanceModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editClearance')}</DialogTitle>
            <DialogDescription>
              {t('editClearanceDescription')}
            </DialogDescription>
          </DialogHeader>
          {selectedClearance && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">{t('status')}</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">{t('pending')}</SelectItem>
                    <SelectItem value="IN_REVIEW">{t('inReview')}</SelectItem>
                    <SelectItem value="APPROVED">{t('approved')}</SelectItem>
                    <SelectItem value="REJECTED">{t('rejected')}</SelectItem>
                    <SelectItem value="COMPLETED">{t('completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editCustomsFee">{t('customsFeesSar')}</Label>
                <Input
                  id="editCustomsFee"
                  type="number"
                  value={editForm.customsFee}
                  onChange={(e) => setEditForm({ ...editForm, customsFee: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editAdditionalFees">{t('additionalFeesSar')}</Label>
                <Input
                  id="editAdditionalFees"
                  type="number"
                  value={editForm.additionalFees}
                  onChange={(e) => setEditForm({ ...editForm, additionalFees: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editEstimatedDate">{t('estimatedCompletionDate')}</Label>
                <Input
                  id="editEstimatedDate"
                  type="date"
                  value={editForm.estimatedCompletionDate}
                  onChange={(e) => setEditForm({ ...editForm, estimatedCompletionDate: e.target.value })}
                />
              </div>
              {editForm.status === 'COMPLETED' && (
                <div>
                  <Label htmlFor="editActualDate">تاريخ الإنجاز الفعلي</Label>
                  <Input
                    id="editActualDate"
                    type="date"
                    value={editForm.actualCompletionDate}
                    onChange={(e) => setEditForm({ ...editForm, actualCompletionDate: e.target.value })}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="editNotes">{t('notes')}</Label>
                <Textarea
                  id="editNotes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateClearance} className="flex-1">
                  {t('update')}
                </Button>
                <Button variant="outline" onClick={() => setEditClearanceModal(false)} className="flex-1">
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            السابق
          </Button>
          <span className="flex items-center px-4">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  )
}
