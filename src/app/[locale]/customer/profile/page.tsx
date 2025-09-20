"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { PageLoading } from "@/components/ui/loading"
import { useLanguage } from "@/components/providers/language-provider"
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Save,
  RefreshCw,
  Shield,
  Bell,
  Globe,
  CreditCard,
  FileText,
  Settings,
} from "lucide-react"

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  customerProfile?: {
    companyName?: string
    address?: string
    taxNumber?: string
    contactPerson?: string
    website?: string
    notes?: string
  }
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  tripUpdates: boolean
  invoiceReminders: boolean
  promotionalEmails: boolean
}

export default function CustomerProfile({ params }: { params: { locale: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { locale } = params
  const { t, language } = useLanguage()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    tripUpdates: true,
    invoiceReminders: true,
    promotionalEmails: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchProfile()
      fetchNotificationSettings()
    }
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/customer/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch("/api/customer/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotificationSettings(data)
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      
      if (response.ok) {
        alert(t("profileUpdatedSuccessfully"))
      } else {
        alert(t("errorUpdatingProfile"))
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert(t("errorUpdatingProfile"))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      const response = await fetch("/api/customer/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationSettings),
      })
      
      if (response.ok) {
        alert(t("notificationSettingsUpdated"))
      } else {
        alert(t("errorUpdatingNotifications"))
      }
    } catch (error) {
      console.error("Error updating notifications:", error)
      alert(t("errorUpdatingNotifications"))
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(t("passwordsDoNotMatch"))
      return
    }

    if (passwordForm.newPassword.length < 6) {
      alert(t("passwordTooShort"))
      return
    }

    try {
      const response = await fetch("/api/customer/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      
      if (response.ok) {
        alert(t("passwordChangedSuccessfully"))
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const error = await response.json()
        alert(error.message || t("errorChangingPassword"))
      }
    } catch (error) {
      console.error("Error changing password:", error)
      alert(t("errorChangingPassword"))
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading text={t("loading")} />
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p>{t("profileNotFound")}</p>
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
            <h1 className="text-3xl font-bold">{t("myProfile")}</h1>
            <p className="text-muted-foreground">{t("manageAccountSettings")}</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
            <TabsTrigger value="company">{t("company")}</TabsTrigger>
            <TabsTrigger value="notifications">{t("notifications")}</TabsTrigger>
            <TabsTrigger value="security">{t("security")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {t("personalInformation")}
                </CardTitle>
                <CardDescription>{t("updatePersonalDetails")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t("fullName")}</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">{t("preferredLanguage")}</Label>
                    <Select defaultValue={language}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="ur">اردو</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? t("saving") : t("saveChanges")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  {t("notificationPreferences")}
                </CardTitle>
                <CardDescription>{t("manageNotificationSettings")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">{t("emailNotifications")}</Label>
                      <p className="text-sm text-muted-foreground">{t("receiveEmailUpdates")}</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({...notificationSettings, emailNotifications: checked})
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsNotifications">{t("smsNotifications")}</Label>
                      <p className="text-sm text-muted-foreground">{t("receiveSMSUpdates")}</p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({...notificationSettings, smsNotifications: checked})
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="tripUpdates">{t("tripUpdates")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifyTripStatusChanges")}</p>
                    </div>
                    <Switch
                      id="tripUpdates"
                      checked={notificationSettings.tripUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({...notificationSettings, tripUpdates: checked})
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="invoiceReminders">{t("invoiceReminders")}</Label>
                      <p className="text-sm text-muted-foreground">{t("remindUpcomingPayments")}</p>
                    </div>
                    <Switch
                      id="invoiceReminders"
                      checked={notificationSettings.invoiceReminders}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({...notificationSettings, invoiceReminders: checked})
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="promotionalEmails">{t("promotionalEmails")}</Label>
                      <p className="text-sm text-muted-foreground">{t("receivePromotionalOffers")}</p>
                    </div>
                    <Switch
                      id="promotionalEmails"
                      checked={notificationSettings.promotionalEmails}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({...notificationSettings, promotionalEmails: checked})
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleSaveNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  {t("saveNotificationSettings")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  {t("changePassword")}
                </CardTitle>
                <CardDescription>{t("updateAccountPassword")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">{t("newPassword")}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleChangePassword}>
                  <Shield className="h-4 w-4 mr-2" />
                  {t("changePassword")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  {t("accountSettings")}
                </CardTitle>
                <CardDescription>{t("manageAccountPreferences")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("twoFactorAuthentication")}</Label>
                      <p className="text-sm text-muted-foreground">{t("addExtraSecurityLayer")}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {t("enable")}
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("loginAlerts")}</Label>
                      <p className="text-sm text-muted-foreground">{t("notifyNewDeviceLogin")}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("sessionTimeout")}</Label>
                      <p className="text-sm text-muted-foreground">{t("automaticLogoutAfterInactivity")}</p>
                    </div>
                    <Select defaultValue="30">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 {t("minutes")}</SelectItem>
                        <SelectItem value="30">30 {t("minutes")}</SelectItem>
                        <SelectItem value="60">1 {t("hour")}</SelectItem>
                        <SelectItem value="120">2 {t("hours")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}


