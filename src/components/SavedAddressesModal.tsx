'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useSavedAddresses, SavedAddress, CreateAddressData } from '@/hooks/useSavedAddresses'
import { MapPin, Plus, Edit, Trash2, Star, Home, Building2, Warehouse } from 'lucide-react'

interface SavedAddressesModalProps {
  onSelectAddress?: (address: SavedAddress) => void
  trigger?: React.ReactNode
}

export function SavedAddressesModal({ onSelectAddress, trigger }: SavedAddressesModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const {
    addresses,
    loading,
    createAddress,
    updateAddress,
    deleteAddress,
    setAsDefault
  } = useSavedAddresses()

  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [formData, setFormData] = useState<CreateAddressData>({
    label: '',
    address: '',
    latitude: null,
    longitude: null,
    cityId: null,
    isDefault: false
  })

  const resetForm = () => {
    setFormData({
      label: '',
      address: '',
      latitude: null,
      longitude: null,
      cityId: null,
      isDefault: false
    })
    setEditingAddress(null)
    setShowAddForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData)
        toast({
          title: t('addressUpdated'),
          description: t('addressUpdatedSuccessfully'),
        })
      } else {
        await createAddress(formData)
        toast({
          title: t('addressSaved'),
          description: t('addressSavedSuccessfully'),
        })
      }
      resetForm()
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('errorSavingAddress'),
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      address: address.address,
      latitude: address.latitude,
      longitude: address.longitude,
      cityId: address.cityId,
      isDefault: address.isDefault
    })
    setShowAddForm(true)
  }

  const handleDelete = async (addressId: string) => {
    try {
      await deleteAddress(addressId)
      toast({
        title: t('addressDeleted'),
        description: t('addressDeletedSuccessfully'),
      })
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('errorDeletingAddress'),
        variant: 'destructive',
      })
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      await setAsDefault(addressId)
      toast({
        title: t('defaultAddressSet'),
        description: t('defaultAddressSetSuccessfully'),
      })
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('errorSettingDefaultAddress'),
        variant: 'destructive',
      })
    }
  }

  const getAddressIcon = (label: string) => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes('home') || lowerLabel.includes('منزل') || lowerLabel.includes('گھر')) {
      return <Home className="h-4 w-4" />
    }
    if (lowerLabel.includes('office') || lowerLabel.includes('مكتب') || lowerLabel.includes('دفتر')) {
      return <Building2 className="h-4 w-4" />
    }
    if (lowerLabel.includes('warehouse') || lowerLabel.includes('مستودع') || lowerLabel.includes('گودام')) {
      return <Warehouse className="h-4 w-4" />
    }
    return <MapPin className="h-4 w-4" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-2" />
            {t('savedAddresses')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('savedAddresses')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Address Button */}
          {!showAddForm && (
            <Button 
              onClick={() => setShowAddForm(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addNewAddress')}
            </Button>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingAddress ? t('editAddress') : t('addNewAddress')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="label">{t('addressLabel')}</Label>
                      <Input
                        id="label"
                        value={formData.label}
                        onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                        placeholder={t('addressLabelPlaceholder')}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isDefault"
                        checked={formData.isDefault}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                      />
                      <Label htmlFor="isDefault">{t('setAsDefault')}</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">{t('fullAddress')}</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder={t('fullAddressPlaceholder')}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingAddress ? t('updateAddress') : t('saveAddress')}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      {t('cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Addresses List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">{t('loading')}</div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noSavedAddresses')}</p>
                <p className="text-sm">{t('addFirstAddress')}</p>
              </div>
            ) : (
              addresses.map((address) => (
                <Card key={address.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getAddressIcon(address.label)}
                          <h3 className="font-semibold">{address.label}</h3>
                          {address.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {t('default')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {address.address}
                        </p>
                        {address.city && (
                          <p className="text-xs text-muted-foreground">
                            {address.city.name}, {address.city.country}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        {onSelectAddress && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onSelectAddress(address)
                              setIsOpen(false)
                            }}
                          >
                            {t('select')}
                          </Button>
                        )}
                        {!address.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetDefault(address.id)}
                            title={t('setAsDefault')}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(address)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(address.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
