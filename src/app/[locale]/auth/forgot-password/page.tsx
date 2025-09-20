"use client"

import React, { useState, use } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Truck, Mail, ArrowRight, CheckCircle } from 'lucide-react'
import { useLanguage } from "@/components/providers/language-provider"

export default function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { t } = useLanguage()
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
      
          <img src="/Website-Logo.png" alt="Logo" className="w-44 h-44 mx-auto mb-4" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Mail className="h-6 w-6" />
              Forgot Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email and we will send you a reset link
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-600">Link sent!</h3>
                  <p className="text-sm text-muted-foreground">
                    If the email <strong>{email}</strong> is registered with us, <br />
                    you will receive a reset link within a few minutes.
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
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
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link href={`/${locale}/auth/signin`} className="text-primary hover:underline">
                  Login
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
                  Send to another email
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <Link href={`/${locale}/auth/signin`} className="text-primary hover:underline">
                  Login
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
