"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  Upload,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react"

interface DocumentsManagementProps {
  clearanceId: string
  clearanceNumber: string
}

export function DocumentsManagement({ clearanceId, clearanceNumber }: DocumentsManagementProps) {
  const { t } = useLanguage()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadModal, setUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const documentTypes = [
    { value: 'BILL_OF_LADING', label: 'بوليصة الشحن', labelEn: 'Bill of Lading' },
    { value: 'COMMERCIAL_INVOICE', label: 'الفاتورة التجارية', labelEn: 'Commercial Invoice' },
    { value: 'PACKING_LIST', label: 'قائمة التعبئة', labelEn: 'Packing List' },
    { value: 'CERTIFICATE_OF_ORIGIN', label: 'شهادة المنشأ', labelEn: 'Certificate of Origin' },
    { value: 'IMPORT_LICENSE', label: 'رخصة الاستيراد', labelEn: 'Import License' },
    { value: 'CUSTOMS_DECLARATION', label: 'الإقرار الجمركي', labelEn: 'Customs Declaration' },
    { value: 'INSURANCE_CERTIFICATE', label: 'شهادة التأمين', labelEn: 'Insurance Certificate' },
    { value: 'OTHER', label: 'أخرى', labelEn: 'Other' }
  ]

  useEffect(() => {
    fetchDocuments()
  }, [clearanceId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customs-broker/clearances/${clearanceId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error(t('failedToLoadDocuments'))
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('fileSizeExceeds10MB'))
      return
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error(t('unsupportedFileType'))
      return
    }

    setSelectedFile(file)
    if (!documentName) {
      setDocumentName(file.name)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    try {
      if (!selectedFile || !documentType || !documentName) {
        toast.error(t('fillAllRequiredFields'))
        return
      }

      setUploading(true)
      setUploadProgress(0)
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentType', documentType)
      formData.append('documentName', documentName)
      formData.append('clearanceId', clearanceId)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      console.log('Uploading file:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        documentType,
        documentName,
        clearanceId
      })

      const response = await fetch(`/api/customs-broker/clearances/${clearanceId}/documents`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log('Upload response status:', response.status)
      console.log('Upload response ok:', response.ok)
      console.log('Upload response statusText:', response.statusText)
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        // Try to parse successful response
        try {
          const result = await response.json()
          console.log('Upload success result:', result)
          toast.success(t('documentUploadedSuccessfully'))
          setTimeout(() => {
            setUploadModal(false)
            setSelectedFile(null)
            setDocumentType('')
            setDocumentName('')
            setUploadProgress(0)
            fetchDocuments()
          }, 1000)
        } catch (jsonError) {
          console.error('Error parsing success response:', jsonError)
          // Even if JSON parsing fails, the upload was successful
          toast.success(t('documentUploadedSuccessfully'))
          setTimeout(() => {
            setUploadModal(false)
            setSelectedFile(null)
            setDocumentType('')
            setDocumentName('')
            setUploadProgress(0)
            fetchDocuments()
          }, 1000)
        }
      } else {
        let errorMessage = t('failedToUploadDocument')
        try {
          const responseText = await response.text()
          console.log('Error response text:', responseText)
          
          if (responseText) {
            try {
              const error = JSON.parse(responseText)
              errorMessage = error.error || errorMessage
            } catch (parseError) {
              console.error('Error parsing error JSON:', parseError)
              errorMessage = responseText || errorMessage
            }
          }
        } catch (textError) {
          console.error('Error reading error response text:', textError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        toast.error(errorMessage)
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error(t('errorUploadingDocument'))
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/customs-broker/clearances/${clearanceId}/documents/${documentId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error(t('failedToDownloadDocument'))
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error(t('errorDownloadingDocument'))
    }
  }

  const handleUpdateStatus = async (documentId: string, status: string) => {
    try {
      const response = await fetch(`/api/customs-broker/clearances/${clearanceId}/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success(t('documentStatusUpdatedSuccessfully'))
        fetchDocuments()
      } else {
        const error = await response.json()
        toast.error(error.error || t('failedToUpdateDocumentStatus'))
      }
    } catch (error) {
      console.error('Error updating document status:', error)
      toast.error(t('errorUpdatingDocumentStatus'))
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      if (!confirm(t('confirmDeleteDocument'))) {
        return
      }

      const response = await fetch(`/api/customs-broker/clearances/${clearanceId}/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success(t('documentDeletedSuccessfully'))
        fetchDocuments()
      } else {
        const error = await response.json()
        toast.error(error.error || t('failedToDeleteDocument'))
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error(t('errorDeletingDocument'))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'UNDER_REVIEW':
        return <AlertTriangle className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      case 'EXPIRED':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('pending')
      case 'UNDER_REVIEW':
        return t('inReview')
      case 'APPROVED':
        return t('approved')
      case 'REJECTED':
        return t('rejected')
      case 'EXPIRED':
        return t('expired')
      default:
        return status
    }
  }

  const getDocumentTypeText = (type: string) => {
    switch (type) {
      case 'COMMERCIAL_INVOICE':
        return t('commercialInvoice')
      case 'PACKING_LIST':
        return t('packingList')
      case 'BILL_OF_LADING':
        return t('billOfLading')
      case 'CERTIFICATE_OF_ORIGIN':
        return t('certificateOfOrigin')
      case 'INSURANCE_CERTIFICATE':
        return t('insuranceCertificate')
      case 'CUSTOMS_DECLARATION':
        return t('customsDeclaration')
      case 'OTHER':
        return t('other')
      default:
        return type
    }

  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string, mimeType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (mimeType.includes('pdf') || extension === 'pdf') {
      return <FileText className="h-4 w-4 text-red-600" />
    }
    if (mimeType.includes('word') || ['doc', 'docx'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-blue-600" />
    }
    if (mimeType.includes('excel') || ['xls', 'xlsx'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-green-600" />
    }
    if (mimeType.includes('image') || ['jpg', 'jpeg', 'png'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-purple-600" />
    }
    
    return <FileText className="h-4 w-4 text-gray-600" />
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{t('documentsManagement')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('customsClearance')}: {clearanceNumber}
          </p>
        </div>

        <Dialog open={uploadModal} onOpenChange={setUploadModal}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              {t('uploadDocument')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('uploadNewDocument')}</DialogTitle>
              <DialogDescription>
                {t('selectDocumentAndTypeToUpload')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="documentType">{t('documentType')}</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectDocumentType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentName">{t('documentName')}</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder={t('enterDocumentName')}
                />
              </div>
              <div>
                <Label htmlFor="file">{t('file')}</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          {t('clickToSelectFile')}
                        </span>
                        {' ' + t('orDragAndDropHere')}
                      </div>
                      <p className="text-xs text-gray-500">
                        {t('supportedFileFormats')}
                      </p>
                    </div>
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-green-600">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('uploadingFile')}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={uploading} className="flex-1">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('upload')}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setUploadModal(false)} className="flex-1">
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadedDocuments')}</CardTitle>
          <CardDescription>{t('listOfUploadedDocuments')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noDocumentsUploaded')}</p>
              <p className="text-sm">{t('startUploadingRequiredDocuments')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('documentName')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('size')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('uploadDate')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getFileIcon(document.documentName, document.mimeType)}
                        <span>{document.documentName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getDocumentTypeText(document.documentType)}</TableCell>
                    <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(document.status)}>
                        {getStatusIcon(document.status)}
                        <span className="mr-1">{getStatusText(document.status)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(document.uploadedAt).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(document.id, document.documentName)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>تحميل المستند</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        {document.status === 'PENDING' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(document.id, 'APPROVED')}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>اعتماد المستند</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(document.id, 'REJECTED')}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>رفض المستند</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(document.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>حذف المستند</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Required Documents Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>المستندات المطلوبة</CardTitle>
          <CardDescription>قائمة بالمستندات الأساسية المطلوبة للتخليص الجمركي</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentTypes.slice(0, -1).map((type) => {
              const hasDocument = documents.some(doc => doc.documentType === type.value)
              const isApproved = documents.some(doc => doc.documentType === type.value && doc.status === 'APPROVED')
              
              return (
                <div key={type.value} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.labelEn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isApproved ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        معتمد
                      </Badge>
                    ) : hasDocument ? (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        مرفوع
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        مطلوب
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  )
}
