'use client'

import React, { use } from 'react'
import { Chatbot } from '@/components/ui/chatbot'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, MessageCircle, Zap, Shield, Clock } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

interface TestChatbotPageProps {
  params: Promise<{
    locale: string
  }>
}

export default function TestChatbotPage({ params }: TestChatbotPageProps) {
  const { locale } = use(params)
  const { t } = useTranslation()

  const testQueries = [
    {
      category: "تتبع الشحنات",
      queries: [
        "PRO-20241224-001",
        "تتبع شحنتي",
        "أين رحلتي؟",
        "حالة الشحنة"
      ]
    },
    {
      category: "الأسعار والخدمات",
      queries: [
        "كم سعر النقل من الرياض لجدة؟",
        "أسعاركم",
        "خدماتكم",
        "أنواع المركبات"
      ]
    },
    {
      category: "معلومات الشركة",
      queries: [
        "معلومات عن الشركة",
        "أرقام التواصل",
        "عنوانكم",
        "من نحن؟"
      ]
    },
    {
      category: "خدمات متخصصة",
      queries: [
        "النقل المبرد",
        "التخليص الجمركي",
        "نقل طوارئ",
        "فواتير إلكترونية"
      ]
    },
    {
      category: "أسئلة شائعة",
      queries: [
        "كيف أحجز رحلة؟",
        "أين السائق؟",
        "متى تصل شحنتي؟",
        "كيف أدفع الفاتورة؟"
      ]
    },
    {
      category: "مشاكل وشكاوى",
      queries: [
        "لدي مشكلة في الشحنة",
        "تأخير في التوصيل",
        "خطأ في الفاتورة",
        "أريد إلغاء الرحلة"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Bot className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">اختبار مساعد PRO FLEET الذكي</h1>
                  <p className="text-muted-foreground">جرب الـ chatbot واختبر قدراته الذكية</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                متصل ونشط
              </Badge>
            </div>
            <Button asChild variant="outline">
              <Link href={`/${locale}`}>
                العودة للرئيسية
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chatbot */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <MessageCircle className="h-5 w-5" />
                  <span>مساعد PRO FLEET الذكي</span>
                </CardTitle>
                <CardDescription>
                  جرب المحادثة مع المساعد الذكي واختبر قدراته في فهم الأسئلة والإجابة عليها
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Chatbot position="relative" defaultOpen={true} />
              </CardContent>
            </Card>
          </div>

          {/* Test Queries and Features */}
          <div className="space-y-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Zap className="h-5 w-5" />
                  <span>مميزات المساعد الذكي</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">تتبع الشحنات</h4>
                    <p className="text-sm text-muted-foreground">أدخل رقم الرحلة للحصول على معلومات مفصلة</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">فهم ذكي للأسئلة</h4>
                    <p className="text-sm text-muted-foreground">يفهم الأسئلة المعقدة ويقدم إجابات مفصلة</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">معلومات شاملة</h4>
                    <p className="text-sm text-muted-foreground">معلومات عن الخدمات والأسعار والشركة</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">متاح 24/7</h4>
                    <p className="text-sm text-muted-foreground">خدمة مستمرة على مدار الساعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Queries */}
            <Card>
              <CardHeader>
                <CardTitle>أمثلة للاختبار</CardTitle>
                <CardDescription>
                  جرب هذه الأسئلة لاختبار قدرات المساعد الذكي
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testQueries.map((category, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-sm mb-2">{category.category}</h4>
                    <div className="space-y-1">
                      {category.queries.map((query, queryIndex) => (
                        <Badge 
                          key={queryIndex} 
                          variant="outline" 
                          className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => {
                            // Try to send message to chatbot directly
                            const chatInput = document.querySelector('input[placeholder*="اكتب رسالتك"]') as HTMLInputElement
                            const sendButton = document.querySelector('button[type="submit"]') as HTMLButtonElement
                            
                            if (chatInput && sendButton) {
                              chatInput.value = query
                              chatInput.dispatchEvent(new Event('input', { bubbles: true }))
                              setTimeout(() => {
                                sendButton.click()
                              }, 100)
                            } else {
                              // Fallback: copy to clipboard
                              if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(query).catch(console.error)
                              } else {
                                const textArea = document.createElement('textarea')
                                textArea.value = query
                                document.body.appendChild(textArea)
                                textArea.select()
                                try {
                                  document.execCommand('copy')
                                } catch (err) {
                                  console.error('Failed to copy text: ', err)
                                }
                                document.body.removeChild(textArea)
                              }
                            }
                          }}
                        >
                          {query}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>كيفية الاستخدام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2 rtl:space-x-reverse">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">1</span>
                  <p>اكتب سؤالك أو طلبك في مربع النص</p>
                </div>
                <div className="flex items-start space-x-2 rtl:space-x-reverse">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">2</span>
                  <p>اضغط إرسال أو Enter للحصول على الإجابة</p>
                </div>
                <div className="flex items-start space-x-2 rtl:space-x-reverse">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">3</span>
                  <p>استخدم الأزرار السريعة للأسئلة الشائعة</p>
                </div>
                <div className="flex items-start space-x-2 rtl:space-x-reverse">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">4</span>
                  <p>لتتبع الشحنات، أدخل رقم الرحلة مباشرة</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
