'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/components/providers/language-provider'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit,
  Save,
  X,
  Loader2,
  Truck,
  Building,
  Calculator,
  FileText,
  Shield
} from 'lucide-react'

interface ProfileCardProps {
  profile: any
  editMode: boolean
  onEdit: () => void
  onSave: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export function ProfileCard({ profile, editMode, onEdit, onSave, onCancel, loading = false }: ProfileCardProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    profileData: getRoleSpecificData(profile)
  })

  function getRoleSpecificData(data: any) {
    if (!data) return {}
    
    switch (data.role) {
      case 'DRIVER':
        return data.driverprofile || data.driverProfile || {}
      case 'CUSTOMER':
        return data.customerprofile || data.customerProfile || {}
      case 'ACCOUNTANT':
        return data.accountantprofile || data.accountantProfile || {}
      case 'CUSTOMS_BROKER':
        return data.customsbrokerprofile || data.customsBrokerProfile || {}
      case 'ADMIN':
        return {} // Admin doesn't have specific profile
      default:
        return {}
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DRIVER': return <Truck className="h-4 w-4" />
      case 'CUSTOMER': return <Building className="h-4 w-4" />
      case 'ACCOUNTANT': return <Calculator className="h-4 w-4" />
      case 'CUSTOMS_BROKER': return <FileText className="h-4 w-4" />
      case 'ADMIN': return <Shield className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return t('admin')
      case 'DRIVER': return t('driver')
      case 'CUSTOMER': return t('customer')
      case 'ACCOUNTANT': return t('accountant')
      case 'CUSTOMS_BROKER': return t('customsBroker')
      default: return role
    }
  }

  const handleSave = () => {
    onSave(formData)
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg">
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{profile.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getRoleIcon(profile.role)}
                  {getRoleName(profile.role)}
                </Badge>
                <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                  {profile.isActive ? t('active') : t('inactive')}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <Button onClick={onEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                {t('edit')}
              </Button>
            ) : (
              <>
                <Button onClick={onCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  {t('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={loading} size="sm">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {t('save')}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('basicInfo')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input
                id="name"
                value={editMode ? formData.name : profile.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!editMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                value={editMode ? formData.phone : profile.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={!editMode}
                placeholder={t('phone')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('joinedDate')}</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Role-specific Information */}
        {profile.role === 'DRIVER' && (profile.driverprofile || profile.driverProfile) && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {t('driverInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">{t('licenseNumber')}</Label>
                <Input
                  id="licenseNumber"
                  value={editMode ? formData.profileData.licenseNumber || '' : (profile.driverprofile || profile.driverProfile)?.licenseNumber || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profileData: { ...prev.profileData, licenseNumber: e.target.value }
                  }))}
                  disabled={!editMode}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('trackingEnabled')}</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editMode ? formData.profileData.trackingEnabled : (profile.driverprofile || profile.driverProfile)?.trackingEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      profileData: { ...prev.profileData, trackingEnabled: checked }
                    }))}
                    disabled={!editMode}
                  />
                  <span className="text-sm">
                    {(editMode ? formData.profileData.trackingEnabled : (profile.driverprofile || profile.driverProfile)?.trackingEnabled) ? t('enabled') : t('disabled')}
                  </span>
                </div>
              </div>
              {(profile.driverprofile || profile.driverProfile)?.assignedVehicle && (
                <div className="space-y-2">
                  <Label>{t('vehicleAssigned')}</Label>
                  <p className="text-sm">
                    {(profile.driverprofile || profile.driverProfile)?.assignedVehicle?.vehicleType?.name} - {(profile.driverprofile || profile.driverProfile)?.assignedVehicle?.capacity} طن
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {profile.role === 'CUSTOMER' && (profile.customerprofile || profile.customerProfile) && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t('customerInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">{t('companyName')}</Label>
                <Input
                  id="companyName"
                  value={editMode ? formData.profileData.companyName || '' : (profile.customerprofile || profile.customerProfile)?.companyName || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profileData: { ...prev.profileData, companyName: e.target.value }
                  }))}
                  disabled={!editMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">{t('businessType')}</Label>
                <Input
                  id="businessType"
                  value={editMode ? formData.profileData.businessType || '' : (profile.customerprofile || profile.customerProfile)?.businessType || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profileData: { ...prev.profileData, businessType: e.target.value }
                  }))}
                  disabled={!editMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxNumber">{t('taxNumber')}</Label>
                <Input
                  id="taxNumber"
                  value={editMode ? formData.profileData.taxNumber || '' : (profile.customerprofile || profile.customerProfile)?.taxNumber || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profileData: { ...prev.profileData, taxNumber: e.target.value }
                  }))}
                  disabled={!editMode}
                />
              </div>
            </div>
          </div>
        )}

        {profile.role === 'ACCOUNTANT' && (profile.accountantprofile || profile.accountantProfile) && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {t('accountantInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">{t('department')}</Label>
                <Input
                  id="department"
                  value={editMode ? formData.profileData.department || '' : (profile.accountantprofile || profile.accountantProfile)?.department || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profileData: { ...prev.profileData, department: e.target.value }
                  }))}
                  disabled={!editMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">{t('employeeId')}</Label>
                <Input
                  id="employeeId"
                  value={editMode ? formData.profileData.employeeId || '' : (profile.accountantprofile || profile.accountantProfile)?.employeeId || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profileData: { ...prev.profileData, employeeId: e.target.value }
                  }))}
                  disabled={!editMode}
                />
              </div>
            </div>
          </div>
        )}

        {profile.role === 'CUSTOMS_BROKER' && (profile.customsbrokerprofile || profile.customsBrokerProfile) && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('customsBrokerInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brokerLicense">{t('brokerLicense')}</Label>
                <Input
                  id="brokerLicense"
                  value={editMode ? formData.profileData.brokerLicense || '' : (profile.customsbrokerprofile || profile.customsBrokerProfile)?.brokerLicense || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profileData: { ...prev.profileData, brokerLicense: e.target.value }
                  }))}
                  disabled={!editMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customsCode">{t('customsCode')}</Label>
                <Input
                  id="customsCode"
                  value={editMode ? formData.profileData.customsCode || '' : (profile.customsbrokerprofile || profile.customsBrokerProfile)?.customsCode || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    profileData: { ...prev.profileData, customsCode: e.target.value }
                  }))}
                  disabled={!editMode}
                />
              </div>
            </div>
          </div>
        )}

        {profile.role === 'ADMIN' && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('adminInfo')}
            </h3>
            <div className="text-sm text-muted-foreground">
              <p>{t('adminDescription1')}</p>
              <p>{t('adminDescription2')}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
