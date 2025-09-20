"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Truck, Shield, Users, Calculator, FileText } from "lucide-react"
import { UserRole } from "@prisma/client"
import { useLanguage } from "@/components/providers/language-provider"

export default function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { t } = useLanguage()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Common fields
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    role: "" as UserRole,
  })

  // Role-specific fields
  const [driverData, setDriverData] = useState({
    nationality: "",
    carPlateNumber: "",
    carRegistration: "",
    licenseExpiry: "",
  })

  const [customerData, setCustomerData] = useState({
    companyName: "",
    address: "",
    preferredLang: "en",
  })

  const [customsBrokerData, setCustomsBrokerData] = useState({
    licenseNumber: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordsDoNotMatch"))
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        ...formData,
        ...(formData.role === UserRole.DRIVER && driverData),
        ...(formData.role === UserRole.CUSTOMER && customerData),
        ...(formData.role === UserRole.CUSTOMS_BROKER && customsBrokerData),
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t("accountCreatedSuccess"))
        setTimeout(() => {
          router.push(`/${locale}/auth/signin`)
        }, 2000)
      } else {
        setError(data.error || t("registrationFailed"))
      }
    } catch (error) {
      setError(t("errorOccurred"))
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="w-full max-w-2xl">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
      
          <img src="/Website-Logo.png" alt="Logo" className="w-44 h-44 mx-auto mb-4" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Join our fleet management platform
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder={t("enterFullName")}
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("enterEmail")}
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder={t("enterPhoneNumber")}
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => updateFormData("role", value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                      <SelectItem value={UserRole.DRIVER}>Driver</SelectItem>
                      <SelectItem value={UserRole.ACCOUNTANT}>Accountant</SelectItem>
                      <SelectItem value={UserRole.CUSTOMS_BROKER}>Customs Broker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("createPassword")}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("confirmPassword")}
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Role-specific Fields */}
              {formData.role === UserRole.DRIVER && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold">Driver Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        placeholder={t("enterNationality")}
                        value={driverData.nationality}
                        onChange={(e) => setDriverData(prev => ({ ...prev, nationality: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carPlateNumber">Car Plate Number</Label>
                      <Input
                        id="carPlateNumber"
                        placeholder={t("enterCarPlateNumber")}
                        value={driverData.carPlateNumber}
                        onChange={(e) => setDriverData(prev => ({ ...prev, carPlateNumber: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carRegistration">Car Registration (Istimara)</Label>
                      <Input
                        id="carRegistration"
                        placeholder={t("enterCarRegistration")}
                        value={driverData.carRegistration}
                        onChange={(e) => setDriverData(prev => ({ ...prev, carRegistration: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licenseExpiry">License Expiry</Label>
                      <Input
                        id="licenseExpiry"
                        type="date"
                        value={driverData.licenseExpiry}
                        onChange={(e) => setDriverData(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.role === UserRole.CUSTOMER && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder={t("enterCompanyName")}
                        value={customerData.companyName}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, companyName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredLang">Preferred Language</Label>
                      <Select value={customerData.preferredLang} onValueChange={(value) => setCustomerData(prev => ({ ...prev, preferredLang: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="ur">Urdu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder={t("enterAddress")}
                        value={customerData.address}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.role === UserRole.CUSTOMS_BROKER && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold">Customs Broker Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      placeholder={t("enterLicenseNumber")}
                      value={customsBrokerData.licenseNumber}
                      onChange={(e) => setCustomsBrokerData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !formData.role}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("creatingAccount")}
                  </>
                ) : (
                  t("createAccount")
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                {t("alreadyHaveAccount")}{" "}
                <Link href={`/${locale}/auth/signin`} className="text-primary hover:underline">
                  {t("signIn")}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}