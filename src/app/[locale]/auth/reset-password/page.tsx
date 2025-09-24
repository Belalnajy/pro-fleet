"use client"

import React, { useEffect, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Truck, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'
import { useLanguage } from "@/components/providers/language-provider"

export default function ResetPasswordPage({ params: pageParams }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(pageParams)
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const params = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const t = params.get('token')
    setToken(t)
    if (!t) {
      setError('الرابط غير صالح')
      setValidating(false)
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${t}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || 'الرمز غير صالح')
        setValid(true)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setValidating(false)
      }
    })()
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    
    // Validation
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.message || 'فشل تغيير كلمة المرور')
      
      setSuccess(true)
      toast({ title: 'تم بنجاح', description: 'تم تغيير كلمة المرور بنجاح' })
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/auth/signin`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Truck className="h-12 w-12 text-primary" />
          </div>
          <img src="/Website-Logo.png" alt="Logo" className="w-44 h-44 mx-auto mb-4" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Lock className="h-6 w-6" />
              إعادة تعيين كلمة المرور
            </CardTitle>
            <CardDescription className="text-center">
              قم بإدخال كلمة المرور الجديدة لحسابك
            </CardDescription>
          </CardHeader>

          {validating ? (
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">جارٍ التحقق من صحة الرابط...</p>
              </div>
            </CardContent>
          ) : !valid ? (
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-600">رابط غير صالح</h3>
                  <p className="text-sm text-muted-foreground">
                    {error || 'هذا الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'}
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/auth/forgot-password">
                    طلب رابط جديد
                  </Link>
                </Button>
              </div>
            </CardContent>
          ) : success ? (
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-600">تم بنجاح!</h3>
                  <p className="text-sm text-muted-foreground">
                    تم تغيير كلمة المرور بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول...
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/${locale}/auth/signin`}>
                    الذهاب لتسجيل الدخول
                  </Link>
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="أدخل كلمة المرور الجديدة"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يجب أن تكون 8 أحرف على الأقل
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="أعد إدخال كلمة المرور"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جارٍ الحفظ...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      حفظ كلمة المرور الجديدة
                    </>
                  )}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  <Link href={`/${locale}/auth/signin`} className="text-primary hover:underline">
                    <span className="hidden md:inline"> العودة لتسجيل الدخول</span>
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
