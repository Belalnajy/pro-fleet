"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useLanguage } from "@/components/providers/language-provider"
import {
  Calculator,
  Search,
  DollarSign,
  Package,
  FileText,
  Loader2,
  Filter,
  Download,
  GitCompare,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { TranslationKey } from "@/locales"

interface FeeCalculatorProps {
  onCalculationComplete?: (calculation: any) => void
}

export function FeeCalculator({ onCalculationComplete }: FeeCalculatorProps) {
  const { t } = useLanguage()
  const [tariffs, setTariffs] = useState<any[]>([])
  const [filteredTariffs, setFilteredTariffs] = useState<any[]>([])
  const [selectedTariff, setSelectedTariff] = useState<any>(null)
  const [selectedForComparison, setSelectedForComparison] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Sorting
  const [sortBy, setSortBy] = useState<'hsCode' | 'dutyRate' | 'vatRate'>('hsCode')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Advanced Filters
  const [filters, setFilters] = useState({
    category: 'all',
    dutyRateMin: '',
    dutyRateMax: '',
    vatRateMin: '',
    vatRateMax: '',
    isActive: true
  })

  const [calculationForm, setCalculationForm] = useState({
    hsCode: '',
    invoiceValue: '',
    weight: ''
  })

  const [calculation, setCalculation] = useState<any>(null)
  
  // Categories for filtering
  const categories = [
    { value: 'all', label: t('all') },
    { value: 'automotive', label: t('automotive') },
    { value: 'electronics', label: t('electronics') },
    { value: 'textiles', label: t('textiles') },
    { value: 'food', label: t('food') },
    { value: 'machinery', label: t('machinery') },
    { value: 'chemicals', label: t('chemicals') },
    { value: 'metals', label: t('metals') },
    { value: 'other', label: t('other') }
  ]

  useEffect(() => {
    fetchTariffs()
  }, [])
  
  useEffect(() => {
    applyFiltersAndSort()
  }, [tariffs, searchTerm, filters, sortBy, sortOrder])

  const fetchTariffs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', '1000') // Get all tariffs for client-side filtering
      
      const response = await fetch(`/api/customs-broker/tariffs?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Handle both old and new API response formats
        const tariffsData = data.tariffs || data
        setTariffs(tariffsData)
      }
    } catch (error) {
      console.error('Error fetching tariffs:', error)
      toast.error(t('fetchError'))
    } finally {
      setLoading(false)
    }
  }
  
  const applyFiltersAndSort = () => {
    let filtered = [...tariffs]
    
    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(tariff => 
        tariff.hsCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tariff.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tariff.descriptionAr.includes(searchTerm)
      )
    }
    
    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(tariff => tariff.category === filters.category)
    }
    
    // Apply duty rate filters
    if (filters.dutyRateMin) {
      filtered = filtered.filter(tariff => tariff.dutyRate >= parseFloat(filters.dutyRateMin))
    }
    if (filters.dutyRateMax) {
      filtered = filtered.filter(tariff => tariff.dutyRate <= parseFloat(filters.dutyRateMax))
    }
    
    // Apply VAT rate filters
    if (filters.vatRateMin) {
      filtered = filtered.filter(tariff => tariff.vatRate >= parseFloat(filters.vatRateMin))
    }
    if (filters.vatRateMax) {
      filtered = filtered.filter(tariff => tariff.vatRate <= parseFloat(filters.vatRateMax))
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'hsCode') {
        aValue = aValue.toString()
        bValue = bValue.toString()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    setFilteredTariffs(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const calculateFees = async () => {
    try {
      if (!calculationForm.hsCode || !calculationForm.invoiceValue) {
        toast.error(t('fillAllRequiredFields'))
        return
      }

      setCalculating(true)
      const response = await fetch('/api/customs-broker/tariffs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hsCode: calculationForm.hsCode,
          invoiceValue: parseFloat(calculationForm.invoiceValue),
          weight: calculationForm.weight ? parseFloat(calculationForm.weight) : null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCalculation(result)
        if (onCalculationComplete) {
          onCalculationComplete(result)
        }
        toast.success(t('feesCalculatedSuccessfully'))
      } else {
        const error = await response.json()
        toast.error(error.error || t('failedToCalculateFees'))
      }
    } catch (error) {
      console.error('Error calculating fees:', error)
      toast.error(t('errorCalculatingFees'))
    } finally {
      setCalculating(false)
    }
  }

  const handleSearch = () => {
    applyFiltersAndSort()
  }
  
  const clearFilters = () => {
    setSearchTerm('')
    setFilters({
      category: 'all',
      dutyRateMin: '',
      dutyRateMax: '',
      vatRateMin: '',
      vatRateMax: '',
      isActive: true
    })
  }
  
  const toggleComparison = (tariff: any) => {
    const isSelected = selectedForComparison.find(t => t.id === tariff.id)
    if (isSelected) {
      setSelectedForComparison(selectedForComparison.filter(t => t.id !== tariff.id))
    } else if (selectedForComparison.length < 3) {
      setSelectedForComparison([...selectedForComparison, tariff])
    } else {
      toast.error(t('canOnlyCompareThreeTariffs'))
    }
  }
  
  const exportTariffs = () => {
    const csvContent = [
      ['HS Code', 'Description (AR)', 'Description (EN)', 'Duty Rate (%)', 'VAT Rate (%)', 'Additional Fees'],
      ...filteredTariffs.map(tariff => [
        tariff.hsCode,
        tariff.descriptionAr,
        tariff.description,
        tariff.dutyRate,
        tariff.vatRate,
        tariff.additionalFees || 0
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `customs-tariffs-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success(t('exportSuccess'))
  }
  
  const handleSort = (column: 'hsCode' | 'dutyRate' | 'vatRate') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const selectTariff = (tariff: any) => {
    setSelectedTariff(tariff)
    setCalculationForm({
      ...calculationForm,
      hsCode: tariff.hsCode
    })
  }
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredTariffs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTariffs = filteredTariffs.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Enhanced Tariff Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('searchCustomsTariffs')}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredTariffs.length} {t('of')} {tariffs.length} {t('tariff')}
              </Badge>
              {selectedForComparison.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <GitCompare className="h-3 w-3" />
                  {selectedForComparison.length} {t('forComparison')}
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            {t('searchAppropriateCustomsTariff')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Action Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={t('searchByHSCodeOrDescription')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {t('advancedFilters')}
              </Button>
              
              <Button
                variant="outline"
                onClick={exportTariffs}
                disabled={filteredTariffs.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t('export')}
              </Button>
              
              {(searchTerm || (filters.category && filters.category !== 'all') || filters.dutyRateMin || filters.dutyRateMax) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {t('clearFilters')}
                </Button>
              )}
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">{t('advancedFilters')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="category">{t('category')}</Label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters({ ...filters, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dutyRateMin">{t('minDutyRate')}</Label>
                    <Input
                      id="dutyRateMin"
                      type="number"
                      placeholder="0"
                      value={filters.dutyRateMin}
                      onChange={(e) => setFilters({ ...filters, dutyRateMin: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dutyRateMax">{t('maxDutyRate')}</Label>
                    <Input
                      id="dutyRateMax"
                      type="number"
                      placeholder="100"
                      value={filters.dutyRateMax}
                      onChange={(e) => setFilters({ ...filters, dutyRateMax: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="vatRateMin">{t('minVatRate')}</Label>
                    <Input
                      id="vatRateMin"
                      type="number"
                      placeholder="0"
                      value={filters.vatRateMin}
                      onChange={(e) => setFilters({ ...filters, vatRateMin: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Comparison Panel */}
          {selectedForComparison.length > 0 && (
            <Card className="mb-6 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitCompare className="h-5 w-5" />
                    {t('title')} ({selectedForComparison.length})
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedForComparison([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedForComparison.map((tariff) => (
                    <div key={tariff.id} className="p-4 border rounded-lg">
                      <div className="font-medium text-primary mb-2">{tariff.hsCode}</div>
                      <div className="text-sm text-muted-foreground mb-2">{tariff.descriptionAr}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>{t('dutyFees')}</span>
                          <span className="font-medium">{tariff.dutyRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('vatTax')}</span>
                          <span className="font-medium">{tariff.vatRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('additionalFees')}</span>
                          <span className="font-medium">{tariff.additionalFees || 0} {t('currency')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Results Table */}
          {filteredTariffs.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedForComparison.length === currentTariffs.length && currentTariffs.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const newSelections = currentTariffs.filter(t => 
                                !selectedForComparison.find(s => s.id === t.id)
                              ).slice(0, 3 - selectedForComparison.length)
                              setSelectedForComparison([...selectedForComparison, ...newSelections])
                            } else {
                              const currentIds = currentTariffs.map(t => t.id)
                              setSelectedForComparison(selectedForComparison.filter(t => !currentIds.includes(t.id)))
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('hsCode')}
                      >
                        <div className="flex items-center gap-2">
                          {t('hsCode')}
                          {sortBy === 'hsCode' && (
                            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>{t('description')}</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('dutyRate')}
                      >
                        <div className="flex items-center gap-2">
                          {t('dutyRate' as TranslationKey)}
                          {sortBy === 'dutyRate' && (
                            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('vatRate')}
                      >
                        <div className="flex items-center gap-2">
                          {t('vatRate')}
                          {sortBy === 'vatRate' && (
                            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>{t('additionalFees')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTariffs.map((tariff) => {
                      const isSelected = selectedTariff?.id === tariff.id
                      const isInComparison = selectedForComparison.find(t => t.id === tariff.id)
                      
                      return (
                        <TableRow 
                          key={tariff.id}
                          className={`cursor-pointer hover:bg-muted/50 ${
                            isSelected ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => selectTariff(tariff)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={!!isInComparison}
                              onCheckedChange={() => toggleComparison(tariff)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{tariff.hsCode}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{tariff.descriptionAr}</div>
                              <div className="text-sm text-muted-foreground">{t('hsCode')}: {tariff.hsCode}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tariff.dutyRate > 15 ? 'destructive' : tariff.dutyRate > 5 ? 'default' : 'secondary'}>
                              {tariff.dutyRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tariff.vatRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tariff.additionalFees ? `${tariff.additionalFees} ${t('currency')}` : t('noAdditionalFees')}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => selectTariff(tariff)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleComparison(tariff)}
                                disabled={!isInComparison && selectedForComparison.length >= 3}
                              >
                                <GitCompare className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t('selectUpTo3')}. {t('showing')} {startIndex + 1} {t('to')} {Math.min(endIndex, filteredTariffs.length)} {t('of')} {filteredTariffs.length} {t('tariff')}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      {t('previous')}
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                        if (pageNumber > totalPages) return null
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {t('next')}
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-4">{t('title')}</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || (filters.category && filters.category !== 'all') ? t('noMatchingTariffs') : t('noTariffsLoaded')}
              </p>
              {(searchTerm || (filters.category && filters.category !== 'all')) && (
                <Button variant="outline" onClick={clearFilters}>
                  {t('clearFilters')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="hsCode">{t('hsCode')}</Label>
              <Input
                id="hsCode"
                value={calculationForm.hsCode}
                onChange={(e) => setCalculationForm({ ...calculationForm, hsCode: e.target.value })}
                placeholder={t('hsCodePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="invoiceValue">{t('invoiceValue')}</Label>
              <Input
                id="invoiceValue"
                type="number"
                value={calculationForm.invoiceValue}
                onChange={(e) => setCalculationForm({ ...calculationForm, invoiceValue: e.target.value })}
                placeholder={t('invoiceValuePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="weight">{t('weight')}</Label>
              <Input
                id="weight"
                type="number"
                value={calculationForm.weight}
                onChange={(e) => setCalculationForm({ ...calculationForm, weight: e.target.value })}
                placeholder={t('weightPlaceholder')}
              />
            </div>
          </div>

          <Button onClick={calculateFees} disabled={calculating} className="w-full">
            {calculating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('calculating')}
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                {t('calculate')}
              </>
            )}
          </Button>

          {/* Calculation Results */}
          {calculation && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('title')}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('hsCode')}</span>
                    <span className="font-medium">{calculation.hsCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('invoiceValue')}</span>
                    <span className="font-medium">{calculation.invoiceValue.toLocaleString()} {t('currency')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('dutyRate')}</span>
                    <span className="font-medium">{calculation.dutyRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('vatRate')}</span>
                    <span className="font-medium">{calculation.vatRate}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('dutyAmount')}</span>
                    <span className="font-medium">{calculation.dutyAmount.toLocaleString()} {t('currency')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('vatAmount')}</span>
                    <span className="font-medium">{calculation.vatAmount.toLocaleString()} {t('currency')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('additionalFees')}</span>
                    <span className="font-medium">{calculation.additionalFees.toLocaleString()} {t('currency')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>{t('totalFees')}</span>
                    <span className="text-primary">{calculation.totalFees.toLocaleString()} {t('currency')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-background rounded border">
                <p className="font-medium mb-2">{t('goodsDescription')}</p>
                <p className="text-sm text-muted-foreground">{calculation.descriptionAr}</p>
                <p className="text-xs text-muted-foreground">{calculation.description}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
