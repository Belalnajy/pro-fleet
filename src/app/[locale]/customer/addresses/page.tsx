'use client'

import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SavedAddressesModal } from '@/components/SavedAddressesModal'
import { useSavedAddresses } from '@/hooks/useSavedAddresses'
import { MapPin, Plus, Home, Building2, Warehouse, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function SavedAddressesPage() {
  const { t } = useTranslation()
  const { addresses, loading } = useSavedAddresses()

  const getAddressIcon = (label: string) => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes('home') || lowerLabel.includes('منزل') || lowerLabel.includes('گھر')) {
      return <Home className="h-5 w-5" />
    }
    if (lowerLabel.includes('office') || lowerLabel.includes('مكتب') || lowerLabel.includes('دفتر')) {
      return <Building2 className="h-5 w-5" />
    }
    if (lowerLabel.includes('warehouse') || lowerLabel.includes('مستودع') || lowerLabel.includes('گودام')) {
      return <Warehouse className="h-5 w-5" />
    }
    return <MapPin className="h-5 w-5" />
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('savedAddresses')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('addFirstAddress')}
          </p>
        </div>
        <SavedAddressesModal
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('addNewAddress')}
            </Button>
          }
        />
      </div>

      {addresses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">{t('noSavedAddresses')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('addFirstAddress')}
            </p>
            <SavedAddressesModal
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addNewAddress')}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((address) => (
            <Card key={address.id} className="relative hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getAddressIcon(address.label)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{address.label}</CardTitle>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          <Star className="h-3 w-3 mr-1" />
                          {t('default')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      {t('fullAddress')}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {address.address}
                    </p>
                  </div>
                  
                  {address.city && (
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        {t('city')}
                      </p>
                      <p className="text-sm">
                        {address.city.name}, {address.city.country}
                      </p>
                    </div>
                  )}

                  {(address.latitude && address.longitude) && (
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">
                        {t('coordinates')}
                      </p>
                      <p className="text-xs font-mono">
                        {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {addresses.length > 0 && (
        <div className="mt-8 text-center">
          <SavedAddressesModal
            trigger={
              <Button variant="outline" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                {t('addNewAddress')}
              </Button>
            }
          />
        </div>
      )}
    </div>
  )
}
