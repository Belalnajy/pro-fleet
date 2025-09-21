'use client';

import { useState, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Users, Truck, Shield, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface TermsPageProps {
  params: Promise<{
    locale: string
  }>
}

export default function TermsPage({ params }: TermsPageProps) {
  const { locale } = use(params);
  const { t, dir } = useLanguage();
  
  return (
    <DashboardLayout
      title={t('termsTitle')}
      subtitle={t('termsSubtitle')}
      actions={
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {t('lastUpdated')}: {t('lastUpdatedDate')}
          </Badge>
          <Link href={`/${locale}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              {t('backToHome')}
            </Button>
          </Link>
        </div>
      }
    >

        {/* Terms Tabs */}
        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('customerTermsTab')}
            </TabsTrigger>
            <TabsTrigger value="driver" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {t('driverTermsTab')}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('privacyPolicyTab')}
            </TabsTrigger>
          </TabsList>

          {/* Customer Terms */}
          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {t('customerTermsTitle')}
                </CardTitle>
                <CardDescription>
                  {t('customerTermsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full">
                  <div className="space-y-6 text-right" dir="rtl">
                    
                    {/* Introduction */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('introduction')}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        تمثل هذه الضوابط والشروط اتفاق رسمي "عقد" بين منصة/تطبيق profleet والعملاء المستخدمين لمنصة/تطبيق profleet و يشار إليها (منصة/تطبيق profleet) فيما بعد بإما أحد هذه الألفاظ أو جميعها ("المنصة" أو "profleet" أو "منصة/تطبيق profleet" أو "التطبيق" أو "تطبيق profleet").
                      </p>
                      <p className="text-muted-foreground leading-relaxed mt-3">
                        إن أي استخدام من قبلك للخدمات التي توفرها منصة/تطبيق profleet يشكل موافقة صريحة منك على هذا العقد وأحكامه وشروطه، وعلى ذلك يجب عليك عدم استخدام المنصة/تطبيق profleet في حال لم تكن موافقاً على الأحكام والشروط الواردة في هذا العقد.
                      </p>
                    </section>

                    {/* Definitions */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('definitions')}</h3>
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-gray-800">الخدمة/خدماتنا/الخدمات:</h4>
                          <p className="text-muted-foreground">هي خدمات الشراء نيابة عن العُملاء والتوصيل إلى منازلهم أو في المواقع التي يتم تحديدها مسبقاً من قبل العميل.</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-gray-800">المنصة/تطبيق profleet:</h4>
                          <p className="text-muted-foreground">هو الموقع الإلكتروني ومنصة وتطبيق profleet الذي يعمل على ربط وتنسيق الطلبات بين العميل والمندوب في مقابل مردود مالي.</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-gray-800">النقل اللوجستي:</h4>
                          <p className="text-muted-foreground">هو نقل البضائع أو الأغراض من نقطة يحددها العميل إلى نقطة أخرى عن طريق الخارطة أو العنوان عن طريق المناديب.</p>
                        </div>
                      </div>
                    </section>

                    {/* Eligibility */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('eligibility')}</h3>
                      <p className="text-muted-foreground mb-3">أنت تقر وتضمن بما لا يدعو للجهالة بالتالي:</p>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>أنه لم يسبق أن تم تعطيل استخدامك لخدمات تطبيق profleet أو منعك من استخدامها في أي وقت من الأوقات.</li>
                        <li>أنك لست منافساً لتطبيق profleet، كما أنك لا تُقدم أي مُنتج مُنافس للخدمات المُقدمة من تطبيق profleet.</li>
                        <li>أنك تتمتع بكامل الأهلية والسُلطة للتعاقد وأنك بذلك لن تكون مُنتهكاً لأي قانون أو عقد.</li>
                      </ul>
                    </section>

                    {/* Commitments */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('commitments')}</h3>
                      <p className="text-muted-foreground mb-3">أنت تُقر وتتعهد بما لا يدعو للجهالة بأنك سوف:</p>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>تمتثل وتخضع لكافة القوانين واللوائح المعمول بها في المملكة العربية السعودية.</li>
                        <li>تُقدم معلومات صحيحة ودقيقة لتطبيق profleet وتقوم بتحديثها بشكل دوري.</li>
                        <li>تستخدم الخدمة والمنصة/تطبيق profleet لأغراض مشروعة ونظامية فقط.</li>
                        <li>لن تستخدم الخدمة للتسبب بإيذاء أو مضايقة أو إزعاج الغير.</li>
                        <li>سوف تحافظ على كلمة المُرور وإسم المستخدم لحسابك بشكلٍ آمن وسري.</li>
                      </ul>
                    </section>

                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Driver Terms */}
          <TabsContent value="driver">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  {t('driverTermsTitle')}
                </CardTitle>
                <CardDescription>
                  {t('driverTermsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full">
                  <div className="space-y-6 text-right" dir="rtl">
                    
                    {/* Introduction */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('introduction')}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        تُمثل هذه الضوابط والشروط اتفاق رسمي "عقد" بين شركة برو المحدودة القابضة سجل تجاري رقم 4030522610 المالك للعلامة التجارية "profleet" ومقدمي خدمات التوصيل (المناديب).
                      </p>
                    </section>

                    {/* Payment Methods */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('paymentMethods')}</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">1. {t('commissionMethod')}</h4>
                          <p className="text-muted-foreground mb-2">
                            وهي عن طريق تحديد منصة/تطبيق profleet نسبة معينة يتم استقطاعها/تحصيلها من مكسب المندوب على كل عملية توصيل مكتملة.
                          </p>
                          <div className="bg-white p-3 rounded border">
                            <p className="text-sm text-gray-600">
                              <strong>مثال للتوضيح:</strong> بافتراض أن تطبيق profleet يحصل على نسبة 20% من كل عملية توصيل مكتملة. فمثلاً كان سعر الطلب (المشتريات) 90 ريال وسعر التوصيل 10 ريالات فإن المجموع 100 ريال. ما يتم تحصيله من المندوب هو 2 ريال، أي 20% من مكسب التوصيل وليس من المبلغ المجمل.
                            </p>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2">2. {t('subscriptionMethod')}</h4>
                          <p className="text-muted-foreground mb-2">
                            وهو السعر الذي تقوم منصة/تطبيق profleet بتحديده للاشتراك الشهري/العضوية لاستخدام منصة/تطبيق profleet.
                          </p>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-800 mb-2">3. {t('fixedAmountMethod')}</h4>
                          <p className="text-muted-foreground mb-2">
                            تقوم منصة/تطبيق profleet بتحديد مبلغ مستقطع وثابت لكل عملية توصيل مكتملة.
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Prohibited Items */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('prohibitedItems')}</h3>
                      <p className="text-muted-foreground mb-3">
                        يحظر على المستخدمين والمناديب شراء أو توصيل أو إرسال أو تلقي أو استلام الفئات التالية من المواد والمُنتجات:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <h5 className="font-semibold text-red-800">{t('alcohol')}</h5>
                          <p className="text-sm text-muted-foreground">المشروبات الروحية والمسكرة، النبيذ، الشمبانيا، البيرة وغيرها من المشروبات المحرمة والممنوعة.</p>
                        </div>
                        
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <h5 className="font-semibold text-red-800">{t('drugs')}</h5>
                          <p className="text-sm text-muted-foreground">المواد المحظورة والمخدرات والأدوية غير القانونية ومعدات التحضير.</p>
                        </div>
                        
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <h5 className="font-semibold text-red-800">{t('weapons')}</h5>
                          <p className="text-sm text-muted-foreground">الأسلحة، الذخيرة وأي مواد أخرى تشمل الأسلحة والسكاكين المخفاة.</p>
                        </div>
                        
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <h5 className="font-semibold text-red-800">{t('heavyItems')}</h5>
                          <p className="text-sm text-muted-foreground">الأشياء الكبيرة التي لا تناسب السيارة الصغيرة والأشياء التي يتجاوز وزنها 40 كيلوجرام.</p>
                        </div>
                      </div>
                    </section>

                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Policy */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t('privacyPolicyTitle')}
                </CardTitle>
                <CardDescription>
                  {t('privacyPolicyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full">
                  <div className="space-y-6 text-right" dir="rtl">
                    
                    {/* Introduction */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('introduction')}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        تحكم سياسة الخصوصية الأسلوب الذي تقوم به "profleet" بجمع، واستخدام، والحفاظ والتصريح بالمعلومات التي تم جمعها من قبل مستخدمين منصة/تطبيق profleet وتُطبق سياسة الخصوصية هذه في التطبيق وكافة المنتجات والخدمات المقدمة من profleet.
                      </p>
                    </section>

                    {/* Personal Information */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('personalInformation')}</h3>
                      <p className="text-muted-foreground mb-3">
                        يقوم profleet بجمع معلومات عن الهوية الشخصية من المستخدمين بطرق مختلفة، وتشمل ولا تقتصر فقط على:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>أوقات زيارة المستخدم للتطبيق</li>
                        <li>التسجيل في منصة/تطبيق profleet</li>
                        <li>تعبئة الطلب ونموذج تحليل الاستبيان</li>
                        <li>الاسم بشكل كامل وعنوان البريد الإلكتروني</li>
                        <li>رقم الهاتف وبيانات بطاقة الائتمان</li>
                      </ul>
                    </section>

                    {/* Data Usage */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('dataUsage')}</h3>
                      <div className="space-y-3">
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-purple-800">{t('improveCustomerService')}</h4>
                          <p className="text-muted-foreground">تساعد المعلومات الخاصة بك منصة/تطبيق profleet على سهولة الاستجابة لطلباتك الموجهة لخدمة العملاء.</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-purple-800">{t('improvePlatform')}</h4>
                          <p className="text-muted-foreground">نسعى باستمرار لتحسين العروض المقدمة وفقاً للمعلومات والملاحظات التي يتم تلقيها منك.</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-purple-800">{t('sendEmails')}</h4>
                          <p className="text-muted-foreground">عنوان البريد الإلكتروني سوف يُستخدم في إرسال معلومات وتحديثات تتعلق بطلبك.</p>
                        </div>
                      </div>
                    </section>

                    {/* Data Protection */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('dataProtection')}</h3>
                      <p className="text-muted-foreground mb-3">
                        نحن نتبع الإجراءات السليمة ومعايير الأمان في جمع وحفظ والتعامل مع البيانات، وذلك لحماية تلك البيانات ضد:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>{t('unauthorizedAccess')}</li>
                        <li>{t('dataModification')}</li>
                        <li>{t('credentialTheft')}</li>
                        <li>{t('unauthorizedTransactions')}</li>
                      </ul>
                      <div className="bg-green-50 p-3 rounded-lg mt-3 border border-green-200">
                        <p className="text-green-800 font-medium">
                          🔒 {t('secureChannels')}
                        </p>
                      </div>
                    </section>

                    {/* Contact Information */}
                    <section>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{t('contactUs')}</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-muted-foreground mb-3">
                          إذا كان لديك أي أسئلة بشأن هذه الشروط أو الممارسات بهذا التطبيق، يمكنكم التواصل معنا من خلال:
                        </p>
                        <ul className="space-y-2 text-muted-foreground">
                          <li><strong>{t('website')}:</strong> <a href="https://www.profleet.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.profleet.app</a></li>
                          <li><strong>{t('email')}:</strong> <a href="mailto:info@profleet.app" className="text-primary hover:underline">info@profleet.app</a></li>
                          <li><strong>{t('twitter')}:</strong> <a href="https://x.com/profleetapp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@profleetapp</a></li>
                          <li><strong>{t('snapchat')}:</strong> <a href="https://snapchat.com/add/profleetapp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">profleetapp</a></li>
                        </ul>
                      </div>
                    </section>

                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="mt-8">
          <CardContent className="text-center p-6">
            <p className="text-muted-foreground">
              © 2025 ProFleet. {t('allRightsReserved')}.
            </p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              تم التعديل بتاريخ: 7 سبتمبر 2025
            </p>
          </CardContent>
        </Card>
    </DashboardLayout>
  );
}
