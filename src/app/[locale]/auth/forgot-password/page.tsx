"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Truck, Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('الرجاء إدخال البريد الإلكتروني')
      return
    }
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.message || 'فشل الطلب')
      
      setSubmitted(true)
      toast({ 
        title: 'تم الإرسال بنجاح', 
        description: 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة التعيين' 
      })
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الإرسال')
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
          <h1 className="text-3xl font-bold text-primary">PRO FLEET</h1>
          <p className="text-muted-foreground mt-2">Smart Fleet. Smart Future.</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Mail className="h-6 w-6" />
              نسيت كلمة المرور
            </CardTitle>
            <CardDescription className="text-center">
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-600">تم إرسال الرابط!</h3>
                  <p className="text-sm text-muted-foreground">
                    إذا كان البريد الإلكتروني <strong>{email}</strong> مسجلاً لدينا،<br />
                    فستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور خلال دقائق قليلة.
                  </p>
                </div>
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
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="أدخل بريدك الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    required
                  />
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
                      جارٍ الإرسال...
                    </>
                  ) : (
                    <>
                      إرسال رابط إعادة التعيين
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  تذكرت كلمة المرور؟{" "}
                  <Link href="/auth/signin" className="text-primary hover:underline">
                    تسجيل الدخول
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}

          {submitted && (
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                }}
              >
                إرسال لبريد آخر
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <Link href="/auth/signin" className="text-primary hover:underline">
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
