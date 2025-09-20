import { useState, useEffect } from 'react'

export interface SavedAddress {
  id: string
  customerId: string
  label: string
  address: string
  latitude?: number | null
  longitude?: number | null
  cityId?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
  city?: {
    id: string
    name: string
    nameAr?: string | null
    country: string
  } | null
}

export interface CreateAddressData {
  label: string
  address: string
  latitude?: number | null
  longitude?: number | null
  cityId?: string | null
  isDefault?: boolean
}

export interface UpdateAddressData extends Partial<CreateAddressData> {}

export function useSavedAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch saved addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/customer/addresses')
      
      if (!response.ok) {
        throw new Error('Failed to fetch addresses')
      }
      
      const data = await response.json()
      setAddresses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Create new address
  const createAddress = async (addressData: CreateAddressData): Promise<SavedAddress> => {
    const response = await fetch('/api/customer/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create address')
    }

    const newAddress = await response.json()
    setAddresses(prev => [newAddress, ...prev])
    return newAddress
  }

  // Update existing address
  const updateAddress = async (addressId: string, addressData: UpdateAddressData): Promise<SavedAddress> => {
    const response = await fetch(`/api/customer/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update address')
    }

    const updatedAddress = await response.json()
    setAddresses(prev => 
      prev.map(addr => addr.id === addressId ? updatedAddress : addr)
    )
    return updatedAddress
  }

  // Delete address
  const deleteAddress = async (addressId: string): Promise<void> => {
    const response = await fetch(`/api/customer/addresses/${addressId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete address')
    }

    setAddresses(prev => prev.filter(addr => addr.id !== addressId))
  }

  // Set address as default
  const setAsDefault = async (addressId: string): Promise<void> => {
    await updateAddress(addressId, { isDefault: true })
  }

  // Get default address
  const getDefaultAddress = (): SavedAddress | null => {
    return addresses.find(addr => addr.isDefault) || null
  }

  // Get addresses by label (for quick access)
  const getAddressByLabel = (label: string): SavedAddress | null => {
    return addresses.find(addr => addr.label.toLowerCase() === label.toLowerCase()) || null
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setAsDefault,
    getDefaultAddress,
    getAddressByLabel,
    refresh: fetchAddresses
  }
}
