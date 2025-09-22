"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Save, Loader2, X, ArrowRight, ArrowLeft } from "lucide-react"
import { TranslationKey } from "@/locales"

interface Trip {
  id: string
  tripNumber: string
  customsBrokerId?: string
  customer: {
    id: string
    name: string
    email: string
  }
  fromCity: {
    name: string
    nameAr: string
  }
  toCity: {
    name: string
    nameAr: string
  }
  price: number
  status: string
}

interface Customer {
  id: string
  name: string
  email: string
}

interface CustomsBroker {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
}


interface CreateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  userRole: "ADMIN" | "ACCOUNTANT"
}

export function CreateInvoiceModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  userRole 
}: CreateInvoiceModalProps) {
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const [loading, setLoading] = useState(false)
  const [trips, setTrips] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [customsBrokers, setCustomsBrokers] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    tripId: '',
    customerId: '',
    customsBrokerId: '',
    subtotal: 0,
    taxRate: 15, // Default 15% VAT
    taxAmount: 0,
    customsFees: 0,
    total: 0,
    dueDate: '',
    notes: ''
  })

  // Calculate totals when amounts change
  useEffect(() => {
    const taxAmount = (formData.subtotal * formData.taxRate) / 100
    const total = formData.subtotal + taxAmount + formData.customsFees
    
    setFormData(prev => ({
      ...prev,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    }))
  }, [formData.subtotal, formData.taxRate, formData.customsFees])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      setFormData({
        tripId: '',
        customerId: '',
        customsBrokerId: '',
        subtotal: 0,
        taxRate: 15,
        taxAmount: 0,
        customsFees: 0,
        total: 0,
        dueDate: '',
        notes: ''
      })
      fetchInitialData()
    }
  }, [open])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      // Determine API endpoint based on user role
      const apiPrefix = userRole === "ADMIN" ? "/api/admin" : "/api/accountant"
      
      // Fetch available trips (completed trips without invoices)
      const tripsResponse = await fetch(`${apiPrefix}/trips?hasInvoice=false`)
      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json()
        console.log('Trips data:', tripsData)
        setTrips(tripsData.trips || [])
      } else {
        console.error('Failed to fetch trips:', tripsResponse.status, tripsResponse.statusText)
      }

      // Fetch customers
      const customersResponse = await fetch(`${apiPrefix}/users?role=CUSTOMER`)
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        console.log('Customers data:', customersData)
        setCustomers(customersData.users || [])
      } else {
        console.error('Failed to fetch customers:', customersResponse.status, customersResponse.statusText)
      }

      // Fetch customs brokers
      const brokersResponse = await fetch(`${apiPrefix}/customs-brokers`)
      if (brokersResponse.ok) {
        const brokersData = await brokersResponse.json()
        console.log('Customs brokers data:', brokersData)
        // Transform the data to match our interface
        const brokers = brokersData.map((broker: any) => ({
          id: broker.id,
          user: {
            id: broker.userId,
            name: broker.name,
            email: broker.email
          }
        })) || []
        setCustomsBrokers(brokers)
      } else {
        console.error('Failed to fetch customs brokers:', brokersResponse.status, brokersResponse.statusText)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: t('errorTitle'),
        description: t('dataLoadError'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTripSelect = (tripId: string) => {
    if (tripId === 'no-trip') {
      setFormData(prev => ({
        ...prev,
        tripId: '',
        customerId: '',
        customsBrokerId: '',
        subtotal: 0
      }))
      return
    }

    const selectedTrip = trips.find(trip => trip.id === tripId)
    if (selectedTrip) {
      setFormData(prev => ({
        ...prev,
        tripId,
        customerId: selectedTrip.customer.id,
        customsBrokerId: selectedTrip.customsBrokerId || '',
        subtotal: selectedTrip.price
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.tripId && !formData.customerId) {
      toast({
        title: t('errorTitle'),
        description: t('selectTripOrCustomer'),
        variant: "destructive"
      })
      return
    }

    if (!formData.subtotal || !formData.dueDate) {
      toast({
        title: t('errorTitle'),
        description: t('fillRequiredFields'),
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const invoiceData = {
        tripId: formData.tripId || null,
        customerId: formData.customerId,
        customsBrokerId: formData.customsBrokerId || null,
        subtotal: formData.subtotal,
        taxAmount: formData.taxAmount,
        customsFees: formData.customsFees,
        dueDate: formData.dueDate,
        notes: formData.notes || null
      }

      // Determine API endpoint based on user role
      const apiEndpoint = userRole === "ADMIN" ? "/api/admin/invoices" : "/api/accountant/invoices"

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const result = await response.json()
      
      toast({
        title: t('successTitle'),
        description: t('invoiceCreatedWithNumber' as TranslationKey, { invoiceNumber: result.invoiceNumber }),
      })

      setFormData({
        tripId: '',
        customerId: '',
        customsBrokerId: '',
        subtotal: 0,
        taxRate: 15,
        taxAmount: 0,
        customsFees: 0,
        total: 0,
        dueDate: '',
        notes: ''
      })
      onOpenChange(false)
      onSuccess?.()
      
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast({
        title: t('errorTitle'),
        description: error instanceof Error ? error.message : t('createInvoiceFailed' as TranslationKey),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Validation function for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Must have either trip or customer selected
        return !!(formData.tripId || formData.customerId)
      case 2:
        // Must have subtotal and due date
        return formData.subtotal > 0 && formData.dueDate !== ''
      case 3:
        // Notes are optional, always valid
        return true
      default:
        return false
    }
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    } else {
      let message = ''
      switch (currentStep) {
        case 1:
          message = t('selectTripOrCustomer')
          break
        case 2:
          message = t('fillRequiredFields')
          break
      }
      toast({
        title: t('incompleteData' as TranslationKey),
        description: message,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-auto max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-gray-50/50">
            <DialogTitle className="text-lg sm:text-xl font-bold">{t('createNewInvoice')}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {t('createNewInvoiceForCustomer')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} id="invoice-form" className="space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Trip and Customer Selection */}
                  {currentStep === 1 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">{t('tripAndCustomerInfo')}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{t('selectTripOrCustomerForInvoice'  as TranslationKey)}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4">
                        {/* Trip Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="tripId" className="text-sm font-medium">{t('tripOptional' as TranslationKey)}</Label>
                          <Select
                            value={formData.tripId || 'no-trip'}
                            onValueChange={handleTripSelect}
                          >
                            <SelectTrigger className="h-auto min-h-[40px]">
                              <SelectValue placeholder={t('selectCompletedTrip' as TranslationKey)}>
                                {formData.tripId && formData.tripId !== 'no-trip' && (
                                  <span className="font-medium">
                                    {trips.find(trip => trip.id === formData.tripId)?.tripNumber || 'رحلة محددة'}
                                  </span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              <SelectItem value="no-trip">{t('noTrip' as TranslationKey)}</SelectItem>
                              {trips.map((trip) => (
                                <SelectItem key={trip.id} value={trip.id} className="p-3">
                                  <div className="flex flex-col w-full">
                                    <span className="font-medium text-sm">{trip.tripNumber}</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                      {trip.fromCity.nameAr} ← {trip.toCity.nameAr}
                                    </span>
                                    <span className="text-xs text-blue-600 mt-1">
                                      {trip.customer.name} - {trip.price} {t('sar')}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Customer Selection (Alternative) */}
                        {!formData.tripId && (
                          <div className="space-y-2">
                            <Label htmlFor="customerId" className="text-sm font-medium">{t('customerRequired' as TranslationKey)}</Label>
                            <Select
                              value={formData.customerId}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('selectCustomer')}>
                                  {formData.customerId && (
                                    <span className="font-medium">
                                      {customers.find(customer => customer.id === formData.customerId)?.name || 'عميل محدد'}
                                    </span>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                {customers.map((customer) => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    <span className="font-medium text-sm">{customer.name}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Customs Broker Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="customsBrokerId" className="text-sm font-medium">{t('customsBrokerOptional' as TranslationKey)}</Label>
                          <Select
                            value={formData.customsBrokerId || 'none'}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, customsBrokerId: value === 'none' ? '' : value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectCustomsBroker' as TranslationKey)}>
                                {formData.customsBrokerId && formData.customsBrokerId !== 'none' && (
                                  <span className="font-medium">
                                    {customsBrokers.find(broker => broker.id === formData.customsBrokerId)?.user.name || 'مخلص جمركي محدد'}
                                  </span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              <SelectItem value="none">{t('noCustomsBroker' as TranslationKey)}</SelectItem>
                              {customsBrokers.map((broker) => (
                                <SelectItem key={broker.id} value={broker.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{broker.user.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Financial Details */}
                  {currentStep === 2 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center">
                          <Calculator className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          {t('financialDetails' as TranslationKey)}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{t('enterAmountsAndFees' as TranslationKey)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {/* Subtotal */}
                          <div className="space-y-2">
                            <Label htmlFor="subtotal" className="text-sm font-medium">{t('subtotalRequired')}</Label>
                            <Input
                              id="subtotal"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.subtotal}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                subtotal: parseFloat(e.target.value) || 0 
                              }))}
                              required
                              placeholder="0.00"
                              className="text-sm"
                            />
                          </div>

                          {/* Tax Rate */}
                          <div className="space-y-2">
                            <Label htmlFor="taxRate" className="text-sm font-medium">{t('taxRate' as TranslationKey)}</Label>
                            <Input
                              id="taxRate"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.taxRate}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                taxRate: parseFloat(e.target.value) || 0 
                              }))}
                              placeholder="15"
                              className="text-sm"
                            />
                          </div>

                          {/* Tax Amount (calculated) */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('taxAmount' as TranslationKey)}</Label>
                            <Input
                              value={formData.taxAmount.toFixed(2)}
                              disabled
                              className="bg-gray-50 text-sm"
                            />
                          </div>

                          {/* Customs Fees */}
                          <div className="space-y-2">
                            <Label htmlFor="customsFees" className="text-sm font-medium">{t('customsFees')}</Label>
                            <Input
                              id="customsFees"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.customsFees}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                customsFees: parseFloat(e.target.value) || 0 
                              }))}
                              placeholder="0.00"
                              className="text-sm"
                            />
                          </div>

                          {/* Total (calculated) */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('total')}</Label>
                            <Input
                              value={`${formData.total.toFixed(2)} ريال`}
                              disabled
                              className="bg-green-50 font-bold text-green-700 text-sm"
                            />
                          </div>

                          {/* Due Date */}
                          <div className="space-y-2">
                            <Label htmlFor="dueDate" className="text-sm font-medium">{t('dueDateRequired')}</Label>
                            <Input
                              id="dueDate"
                              type="date"
                              value={formData.dueDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                              required
                              min={new Date().toISOString().split('T')[0]}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notes Section */}
                  {currentStep === 3 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">{t('additionalNotes')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          placeholder={t('enterAdditionalNotes')}
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="text-sm resize-none"
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="border-t bg-gray-50/50 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-4">
              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                {t('cancel')}
              </Button>

              {/* Navigation Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t('back')}
                  </Button>
                )}
                
                {currentStep < 3 && (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {t('next')}
                    <ArrowLeft className="h-4 w-4 ml-2" />
                  </Button>
                )}
                
                {currentStep === 3 && (
                  <Button
                    type="submit"
                    form="invoice-form"
                    disabled={loading}
                    className="w-full sm:w-auto sm:min-w-[140px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm sm:text-base">{t('creatingInvoice')}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span className="text-sm sm:text-base">{t('createInvoice')}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
