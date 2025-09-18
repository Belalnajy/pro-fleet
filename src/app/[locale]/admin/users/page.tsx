"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/components/providers/language-provider"
import { useRTL } from "@/components/ui/rtl-wrapper"
import { cn } from "@/lib/utils"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  Truck,
  Calculator,
  FileText,
  UserPlus,
} from "lucide-react"
import { UserRole } from "@prisma/client"

interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  isActive: boolean
  createdAt: string
  driverProfile?: any
  customerProfile?: any
  accountantProfile?: any
  customsBrokerProfile?: any
}

export default function UsersManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { isRTL, dir } = useRTL()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [statusToggleUser, setStatusToggleUser] = useState<User | null>(null)

  // Form state
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER" as UserRole,
    isActive: true,
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }
    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError("Failed to fetch users")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    // Validation
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.role) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setError("")
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          password: userForm.password,
          role: userForm.role,
        }),
      })

      if (response.ok) {
        await fetchUsers()
        setIsAddDialogOpen(false)
        resetForm()
        setError("")
        toast.success("User created successfully")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Error adding user:", error)
      setError("Network error")
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      setError("")
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          isActive: userForm.isActive,
        }),
      })

      if (response.ok) {
        await fetchUsers()
        setEditingUser(null)
        resetForm()
        setError("")
        toast.success("User updated successfully")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      setError("Network error")
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      if (response.ok) {
        fetchUsers()
        toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`)
        setStatusToggleUser(null)
      } else {
        setError("Failed to update user status")
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      setError("Network error")
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.role,
      isActive: user.isActive,
    })
  }

  const resetForm = () => {
    setUserForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "CUSTOMER",
      isActive: true,
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && user.isActive) ||
                         (statusFilter === "inactive" && !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="h-4 w-4" />
      case UserRole.DRIVER:
        return <Truck className="h-4 w-4" />
      case UserRole.CUSTOMER:
        return <Users className="h-4 w-4" />
      case UserRole.ACCOUNTANT:
        return <Calculator className="h-4 w-4" />
      case UserRole.CUSTOMS_BROKER:
        return <FileText className="h-4 w-4" />
      default:
        return <UserPlus className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800"
      case UserRole.DRIVER:
        return "bg-blue-100 text-blue-800"
      case UserRole.CUSTOMER:
        return "bg-green-100 text-green-800"
      case UserRole.ACCOUNTANT:
        return "bg-purple-100 text-purple-800"
      case UserRole.CUSTOMS_BROKER:
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <DashboardLayout
      title={t("users")}
      subtitle={t("manageUsersDesc")}
      actions={
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t("addUser")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]" dir={dir}>
            <DialogHeader>
              <DialogTitle>{t("addUser")}</DialogTitle>
              <DialogDescription>{t("manageUsersDesc")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-name" className={cn(isRTL ? "text-right" : "text-left")}>
                  {t("name")}
                </Label>
                <Input
                  id="add-name"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  placeholder={t("enterName")}
                  dir={dir}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-email" className={cn(isRTL ? "text-right" : "text-left")}>
                  {t("email")}
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3"
                  placeholder={t("enterEmail")}
                  dir={dir}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-phone" className={cn(isRTL ? "text-right" : "text-left")}>
                  {t("phone")}
                </Label>
                <Input
                  id="add-phone"
                  value={userForm.phone}
                  onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="col-span-3"
                  placeholder={t("enterPhone")}
                  dir={dir}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-password" className={cn(isRTL ? "text-right" : "text-left")}>
                  {t("password")}
                </Label>
                <Input
                  id="add-password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="col-span-3"
                  placeholder={t("enterPassword")}
                  dir={dir}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-role" className={cn(isRTL ? "text-right" : "text-left")}>
                  {t("role")}
                </Label>
                <Select value={userForm.role} onValueChange={(value) => setUserForm(prev => ({ ...prev, role: value as UserRole }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t("selectOption")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                    <SelectItem value={UserRole.DRIVER}>Driver</SelectItem>
                    <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                    <SelectItem value={UserRole.ACCOUNTANT}>Accountant</SelectItem>
                    <SelectItem value={UserRole.CUSTOMS_BROKER}>Customs Broker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && (
              <Alert className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
                setError("")
              }}>
                {t("cancel")}
              </Button>
              <Button onClick={handleAddUser}>
                {t("addUser")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admins")}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === UserRole.ADMIN).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("drivers")}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === UserRole.DRIVER).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("customers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === UserRole.CUSTOMER).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("active")}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{`${t("search")} & ${t("filter")}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-4" : "space-x-4")}>
            <div className="relative flex-1 max-w-sm">
              <Search className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(isRTL ? "pr-10" : "pl-10")}
                dir={dir}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("users")}</CardTitle>
          <CardDescription>
            {t("manageUsersDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(isRTL ? "text-right" : "text-left")}>{t("users")}</TableHead>
                  <TableHead className={cn(isRTL ? "text-right" : "text-left")}>{t("role")}</TableHead>
                  <TableHead className={cn(isRTL ? "text-right" : "text-left")}>{t("status")}</TableHead>
                  <TableHead className={cn(isRTL ? "text-right" : "text-left")}>{t("phone")}</TableHead>
                  <TableHead className={cn(isRTL ? "text-right" : "text-left")}>Created</TableHead>
                  <TableHead className={cn(isRTL ? "text-left" : "text-right")}>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className={cn(isRTL ? "text-right" : "text-left")}>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-1" : "space-x-1")}>
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role.toLowerCase()}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.phone && <div>{user.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className={cn(isRTL ? "text-left" : "text-right")}>
                      <div className={cn("flex items-center", isRTL ? "justify-start space-x-reverse space-x-2" : "justify-end space-x-2")}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setStatusToggleUser(user)}
                          className={user.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                        >
                          {user.isActive ? <Trash2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => {
        if (!open) {
          setEditingUser(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={userForm.name}
                onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={userForm.phone}
                onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Role
              </Label>
              <Select value={userForm.role} onValueChange={(value) => setUserForm(prev => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.DRIVER}>Driver</SelectItem>
                  <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                  <SelectItem value={UserRole.ACCOUNTANT}>Accountant</SelectItem>
                  <SelectItem value={UserRole.CUSTOMS_BROKER}>Customs Broker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Select value={userForm.isActive ? "active" : "inactive"} onValueChange={(value) => setUserForm(prev => ({ ...prev, isActive: value === "active" }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingUser(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirmation Dialog */}
      <AlertDialog open={!!statusToggleUser} onOpenChange={(open) => {
        if (!open) setStatusToggleUser(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusToggleUser?.isActive ? 'Deactivate User' : 'Activate User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {statusToggleUser?.isActive ? 'deactivate' : 'activate'} <strong>{statusToggleUser?.name}</strong>?
              {statusToggleUser?.isActive 
                ? ' This user will no longer be able to access the system.' 
                : ' This user will regain access to the system.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStatusToggleUser(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => statusToggleUser && handleToggleUserStatus(statusToggleUser)}
              className={statusToggleUser?.isActive 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-green-600 hover:bg-green-700"}
            >
              {statusToggleUser?.isActive ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}