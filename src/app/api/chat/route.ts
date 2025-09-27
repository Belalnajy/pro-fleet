import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, TripStatus } from "@prisma/client"

// Enhanced chatbot responses for fleet management
const chatbotResponses = {
  // Greetings
  greetings: {
    patterns: ["hello", "hi", "hey", "مرحبا", "مرحباً", "أهلا", "أهلاً", "السلام عليكم"],
    responses: [
      "مرحباً! أنا مساعد PRO FLEET الذكي 🤖\nكيف يمكنني مساعدتك اليوم؟",
      "أهلاً وسهلاً! 👋\nأنا هنا لمساعدتك في جميع خدمات النقل والشحن",
      "مرحباً بك في PRO FLEET! 🚛\nكيف يمكنني خدمتك؟"
    ]
  },
  
  // Trip tracking
  tracking: {
    patterns: ["track", "تتبع", "tracking", "موقع", "location", "أين", "where"],
    responses: [
      "🔍 لتتبع شحنتك:\n• أدخل رقم الرحلة (مثل: PRO-20241224-001)\n• أو اذهب لصفحة 'تتبع الشحنات'\n• أو قل لي رقم الرحلة مباشرة"
    ]
  },
  
  // Trip management
  trips: {
    patterns: ["trip", "رحلة", "رحلات", "شحنة", "شحنات", "حجز", "book"],
    responses: [
      "🚛 خدمات الرحلات:\n• حجز رحلة جديدة\n• تتبع الرحلات الحالية\n• تاريخ الرحلات\n• إلغاء أو تعديل الرحلة\n\nماذا تريد أن تفعل؟"
    ]
  },
  
  // Pricing
  pricing: {
    patterns: ["price", "سعر", "أسعار", "تكلفة", "cost", "pricing", "كم", "how much"],
    responses: [
      "💰 أسعارنا تعتمد على:\n• المسافة والمسار\n• نوع المركبة المطلوبة\n• درجة الحرارة (عادي/مبرد/مجمد)\n• الوزن والحجم\n• الخدمات الإضافية\n\nيمكنك الحصول على عرض سعر فوري من صفحة 'حجز رحلة'"
    ]
  },
  
  // Status inquiries
  status: {
    patterns: ["status", "حالة", "وضع", "situation", "condition"],
    responses: [
      "📊 لمعرفة حالة رحلتك:\n• أدخل رقم الرحلة هنا\n• تفقد صفحة 'رحلاتي'\n• ستصلك إشعارات تلقائية عند تغيير الحالة\n\nأو أخبرني برقم الرحلة لأعطيك التفاصيل فوراً"
    ]
  },
  
  // Company info
  company: {
    patterns: ["company", "شركة", "معلومات", "info", "about", "عن", "من نحن"],
    responses: [
      "🏢 PRO FLEET - شركة رائدة في النقل والشحن:\n• خبرة واسعة في النقل البري\n• أسطول حديث ومتنوع\n• تتبع مباشر وفوري\n• خدمة عملاء 24/7\n• تغطية شاملة للمملكة\n\n📞 للتواصل: +966 53 997 7837\n📧 البريد: info@profleet.app"
    ]
  },
  
  // Services
  services: {
    patterns: ["services", "خدمات", "service", "خدمة", "ماذا تقدمون", "what do you offer"],
    responses: [
      "🛠️ خدماتنا الشاملة:\n• 🚛 النقل العام والمتخصص\n• ❄️ النقل المبرد والمجمد\n• 📋 التخليص الجمركي\n• 📍 التتبع المباشر\n• 📊 إدارة الأسطول\n• 💼 الحلول اللوجستية\n• 🏪 التوصيل للمتاجر\n• 🏭 النقل الصناعي"
    ]
  },
  
  // Support
  support: {
    patterns: ["help", "مساعدة", "support", "دعم", "مشكلة", "problem", "issue"],
    responses: [
      "🆘 كيف يمكنني مساعدتك؟\n• تتبع الشحنات والرحلات\n• الاستعلام عن الأسعار\n• حجز رحلة جديدة\n• مشاكل تقنية\n• استفسارات عامة\n\n📞 للدعم الفوري: +966 53 997 7837\n⏰ متاحون 24/7"
    ]
  },
  
  // Contact
  contact: {
    patterns: ["contact", "تواصل", "اتصال", "رقم", "phone", "email", "بريد"],
    responses: [
      "📞 طرق التواصل معنا:\n• الهاتف: +966 53 997 7837\n• الرقم الموحد: 8002440411\n• البريد الإلكتروني: info@profleet.app\n• الموقع: www.profleet.app\n\n📍 العنوان: الرياض، المملكة العربية السعودية\n⏰ خدمة العملاء: 24/7"
    ]
  },

  // Cities and routes
  cities: {
    patterns: ["مدن", "cities", "routes", "مسارات", "destinations", "وجهات"],
    responses: [
      "🏙️ نغطي جميع مدن المملكة:\n• الرياض - جدة - مكة المكرمة\n• المدينة المنورة - الدمام - الخبر\n• الطائف - تبوك - أبها\n• جازان - نجران - حائل\n• القصيم - الأحساء - ينبع\n\n📍 تغطية شاملة لجميع المناطق"
    ]
  },

  // Vehicle types
  vehicles: {
    patterns: ["مركبات", "vehicles", "truck", "شاحنة", "نقل", "transport"],
    responses: [
      "🚛 أسطولنا المتنوع:\n• شاحنات صغيرة (1-3 طن)\n• شاحنات متوسطة (5-10 طن)\n• شاحنات كبيرة (15-30 طن)\n• مقطورات (40+ طن)\n• مركبات مبردة ومجمدة\n• مركبات متخصصة للبضائع الحساسة"
    ]
  },

  // Temperature control
  temperature: {
    patterns: ["حرارة", "temperature", "مبرد", "مجمد", "cold", "frozen", "refrigerated"],
    responses: [
      "🌡️ خدمات التحكم في درجة الحرارة:\n• النقل العادي (درجة حرارة الجو)\n• النقل المبرد (2-8°م)\n• النقل المجمد (-18°م)\n• مراقبة مستمرة للحرارة\n• تنبيهات فورية عند تجاوز الحدود\n• تقارير مفصلة لدرجات الحرارة"
    ]
  },

  // Customs clearance
  customs: {
    patterns: ["جمارك", "customs", "clearance", "تخليص", "استيراد", "تصدير"],
    responses: [
      "📋 خدمات التخليص الجمركي:\n• تخليص البضائع المستوردة\n• تخليص البضائع المصدرة\n• إعداد الوثائق المطلوبة\n• متابعة الإجراءات الجمركية\n• استشارات جمركية\n• خدمة سريعة ومضمونة"
    ]
  },

  // Invoices and payments
  invoices: {
    patterns: ["فاتورة", "invoice", "دفع", "payment", "حساب", "bill"],
    responses: [
      "💳 إدارة الفواتير والمدفوعات:\n• فواتير إلكترونية فورية\n• طرق دفع متعددة\n• تقسيط المدفوعات\n• تتبع حالة الدفع\n• تقارير مالية مفصلة\n• دعم للدفع الآجل للشركات"
    ]
  },

  // Emergency and urgent
  emergency: {
    patterns: ["طوارئ", "emergency", "urgent", "عاجل", "سريع", "fast"],
    responses: [
      "🚨 خدمات الطوارئ والنقل العاجل:\n• نقل فوري خلال ساعات\n• فريق طوارئ متاح 24/7\n• أولوية قصوى للشحنات العاجلة\n• تتبع مكثف ومستمر\n• تواصل مباشر مع فريق العمليات\n\n📞 للطوارئ: +966 53 997 7837"
    ]
  },
  
  // Goodbye
  goodbye: {
    patterns: ["bye", "goodbye", "مع السلامة", "وداعا", "شكرا", "thanks", "thank you"],
    responses: [
      "شكراً لك! 🙏\nأتمنى أن أكون قد ساعدتك\nلا تتردد في العودة إلي في أي وقت",
      "مع السلامة! 👋\nكان من دواعي سروري مساعدتك\nPRO FLEET في خدمتك دائماً"
    ]
  }
}

// Enhanced response matching function with smart understanding
function findBestResponse(userMessage: string): string {
  const message = userMessage.toLowerCase().trim()
  
  // Smart question analysis
  const questionWords = ["كيف", "ماذا", "متى", "أين", "لماذا", "من", "what", "how", "when", "where", "why", "who"]
  const isQuestion = questionWords.some(word => message.includes(word)) || message.includes("؟") || message.includes("?")
  
  // Check for multiple topics in one message
  let matchedCategories: string[] = []
  let bestResponse = ""
  
  // Check each category for matches
  for (const [category, data] of Object.entries(chatbotResponses)) {
    for (const pattern of data.patterns) {
      if (message.includes(pattern.toLowerCase())) {
        matchedCategories.push(category)
        if (!bestResponse) {
          const responses = data.responses
          bestResponse = responses[Math.floor(Math.random() * responses.length)]
        }
        break
      }
    }
  }
  
  // Handle multiple topics
  if (matchedCategories.length > 1) {
    const topics = matchedCategories.map(cat => {
      switch(cat) {
        case 'tracking': return 'تتبع الشحنات'
        case 'pricing': return 'الأسعار'
        case 'services': return 'الخدمات'
        case 'company': return 'معلومات الشركة'
        case 'contact': return 'التواصل'
        case 'vehicles': return 'المركبات'
        case 'temperature': return 'التحكم في الحرارة'
        case 'customs': return 'التخليص الجمركي'
        default: return cat
      }
    }).join(' و ')
    
    return `🤖 أرى أنك تسأل عن ${topics}.\n\n${bestResponse}\n\n💡 هل تريد معلومات أكثر تفصيلاً عن أي من هذه المواضيع؟`
  }
  
  // Handle questions with context
  if (isQuestion && bestResponse) {
    return `❓ ${bestResponse}\n\n🔍 هل هذا يجيب على سؤالك؟ إذا كنت تحتاج معلومات أكثر تفصيلاً، فقط اسأل!`
  }
  
  // Return best match if found
  if (bestResponse) {
    return bestResponse
  }
  
  // Smart default response based on message content
  if (message.length < 3) {
    return "🤔 رسالة قصيرة جداً! يمكنك كتابة سؤال أو طلب أكثر تفصيلاً وسأكون سعيداً لمساعدتك."
  }
  
  if (isQuestion) {
    return "❓ سؤال رائع! لكن لم أتمكن من فهمه تماماً.\n\n💡 يمكنك السؤال عن:\n• تتبع الشحنات (أدخل رقم الرحلة)\n• الأسعار والتكاليف\n• أنواع المركبات والخدمات\n• التخليص الجمركي\n• معلومات الشركة والتواصل\n\n📞 أو تواصل مباشرة: +966 53 997 7837"
  }
  
  // Default response with helpful suggestions
  return "🤔 عذراً، لم أفهم طلبك تماماً.\n\n💡 يمكنك السؤال عن:\n• تتبع الشحنات (أدخل رقم الرحلة)\n• الأسعار والتكاليف\n• حجز رحلة جديدة\n• خدماتنا ومعلومات الشركة\n• الدعم والمساعدة\n\n📞 أو تواصل مباشرة: +966 53 997 7837\n\n💬 جرب أن تكون أكثر تحديداً في سؤالك!"
}

// Get trip status in Arabic
function getTripStatusArabic(status: TripStatus): string {
  const statusMap = {
    PENDING: "في الانتظار",
    ASSIGNED: "تم التعيين",
    IN_PROGRESS: "بدأت الرحلة",
    EN_ROUTE_PICKUP: "في الطريق للاستلام",
    AT_PICKUP: "وصل لنقطة الاستلام",
    PICKED_UP: "تم الاستلام",
    IN_TRANSIT: "في الطريق للوجهة",
    AT_DESTINATION: "وصل للوجهة",
    DELIVERED: "تم التسليم",
    CANCELLED: "ملغية"
  }
  return statusMap[status] || status
}

// Handle advanced queries with database access
async function handleAdvancedQueries(userMessage: string, session: any): Promise<string | null> {
  const message = userMessage.toLowerCase().trim()
  
  try {
    // Skip database queries if user is not a customer
    if (session.user.role !== UserRole.CUSTOMER) {
      return null
    }
    // Check for "my trips" or "رحلاتي"
    if (message.includes("رحلاتي") || message.includes("my trips") || message.includes("trips")) {
      if (session.user.role === UserRole.CUSTOMER) {
        const trips = await db.trip.findMany({
          where: { customerId: session.user.id },
          include: {
            fromCity: true,
            toCity: true,
            vehicle: {
              include: { vehicleType: true }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5
        })

        if (trips.length === 0) {
          return "📦 لا توجد رحلات مسجلة باسمك حالياً.\n\n🚛 يمكنك حجز رحلة جديدة من صفحة 'حجز رحلة'\n\n💡 هل تحتاج مساعدة في الحجز؟"
        }

        let response = `📦 آخر ${trips.length} رحلات لك:\n\n`
        trips.forEach((trip, index) => {
          const status = getTripStatusArabic(trip.status)
          response += `${index + 1}. ${trip.tripNumber}\n`
          response += `   📍 ${trip.fromCity.nameAr || trip.fromCity.name} → ${trip.toCity.nameAr || trip.toCity.name}\n`
          response += `   📊 ${status}\n`
          response += `   💰 ${trip.price} ${trip.currency}\n\n`
        })

        response += "💡 لمزيد من التفاصيل، أدخل رقم الرحلة أو اذهب لصفحة 'رحلاتي'"
        return response
      }
    }

    // Check for "my invoices" or "فواتيري"
    if (message.includes("فواتيري") || message.includes("my invoices") || message.includes("invoices") || message.includes("فواتير")) {
      if (session.user.role === UserRole.CUSTOMER) {
        const invoices = await db.invoice.findMany({
          where: { 
            OR: [
              { trip: { customerId: session.user.id } },
              { customerId: session.user.id }
            ]
          },
          include: {
            trip: {
              include: {
                fromCity: true,
                toCity: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5
        })

        if (invoices.length === 0) {
          return "💳 لا توجد فواتير مسجلة باسمك حالياً.\n\n📋 الفواتير تُنشأ تلقائياً عند اكتمال الرحلات\n\n💡 هل تحتاج مساعدة في شيء آخر؟"
        }

        let response = `💳 آخر ${invoices.length} فواتير لك:\n\n`
        invoices.forEach((invoice, index) => {
          const statusText = {
            PENDING: "في الانتظار",
            SENT: "تم الإرسال", 
            PAID: "مدفوعة",
            PARTIAL: "مدفوعة جزئياً",
            OVERDUE: "متأخرة",
            CANCELLED: "ملغية"
          }[invoice.paymentStatus] || invoice.paymentStatus

          response += `${index + 1}. ${invoice.invoiceNumber}\n`
          if (invoice.trip) {
            response += `   📍 ${invoice.trip.fromCity?.nameAr || invoice.trip.fromCity?.name} → ${invoice.trip.toCity?.nameAr || invoice.trip.toCity?.name}\n`
          }
          response += `   💰 ${invoice.total} ريال\n`
          response += `   📊 ${statusText}\n`
          response += `   💳 متبقي: ${invoice.remainingAmount} ريال\n\n`
        })

        response += "💡 لمزيد من التفاصيل، اذهب لصفحة 'فواتيري'"
        return response
      }
    }

    // Check for recent activity
    if (message.includes("آخر") || message.includes("recent") || message.includes("latest") || message.includes("جديد")) {
      if (session.user.role === UserRole.CUSTOMER) {
        // Get recent trips and invoices
        const recentTrips = await db.trip.findMany({
          where: { customerId: session.user.id },
          include: {
            fromCity: true,
            toCity: true
          },
          orderBy: { createdAt: "desc" },
          take: 3
        })

        const recentInvoices = await db.invoice.findMany({
          where: { 
            OR: [
              { trip: { customerId: session.user.id } },
              { customerId: session.user.id }
            ]
          },
          orderBy: { createdAt: "desc" },
          take: 2
        })

        let response = "📊 آخر نشاطاتك:\n\n"
        
        if (recentTrips.length > 0) {
          response += "🚛 آخر الرحلات:\n"
          recentTrips.forEach((trip, index) => {
            const status = getTripStatusArabic(trip.status)
            response += `• ${trip.tripNumber} - ${status}\n`
          })
          response += "\n"
        }

        if (recentInvoices.length > 0) {
          response += "💳 آخر الفواتير:\n"
          recentInvoices.forEach((invoice, index) => {
            const statusText = {
              PENDING: "في الانتظار",
              SENT: "تم الإرسال", 
              PAID: "مدفوعة",
              PARTIAL: "مدفوعة جزئياً",
              OVERDUE: "متأخرة",
              CANCELLED: "ملغية"
            }[invoice.paymentStatus] || invoice.paymentStatus
            response += `• ${invoice.invoiceNumber} - ${statusText}\n`
          })
        }

        if (recentTrips.length === 0 && recentInvoices.length === 0) {
          response = "📊 لا يوجد نشاط حديث.\n\n🚛 يمكنك حجز رحلة جديدة للبدء!"
        }

        return response
      }
    }

    // Check for statistics
    if (message.includes("إحصائيات") || message.includes("statistics") || message.includes("stats") || message.includes("أرقام")) {
      if (session.user.role === UserRole.CUSTOMER) {
        const stats = await db.trip.groupBy({
          by: ['status'],
          where: { customerId: session.user.id },
          _count: { status: true }
        })

        const totalTrips = stats.reduce((sum, stat) => sum + stat._count.status, 0)
        
        if (totalTrips === 0) {
          return "📊 لا توجد إحصائيات متاحة حالياً.\n\n🚛 احجز رحلتك الأولى لتبدأ في تجميع الإحصائيات!"
        }

        let response = `📊 إحصائياتك الشخصية:\n\n`
        response += `📦 إجمالي الرحلات: ${totalTrips}\n\n`

        stats.forEach(stat => {
          const statusText = getTripStatusArabic(stat.status)
          response += `• ${statusText}: ${stat._count.status}\n`
        })

        // Get total spent
        const totalSpent = await db.invoice.aggregate({
          where: { 
            OR: [
              { trip: { customerId: session.user.id } },
              { customerId: session.user.id }
            ],
            paymentStatus: 'PAID'
          },
          _sum: { total: true }
        })

        if (totalSpent._sum.total) {
          response += `\n💰 إجمالي المبلغ المدفوع: ${totalSpent._sum.total} ريال`
        }

        return response
      }
    }

    // Check for booking assistance
    if (message.includes("حجز") || message.includes("book") || message.includes("رحلة جديدة") || message.includes("new trip")) {
      if (session.user.role === UserRole.CUSTOMER) {
        // Get user's most common routes for suggestions
        const commonRoutes = await db.trip.groupBy({
          by: ['fromCityId', 'toCityId'],
          where: { customerId: session.user.id },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 3
        })

        let response = "🚛 أساعدك في حجز رحلة جديدة!\n\n"
        
        if (commonRoutes.length > 0) {
          // Get city names for suggestions
          const cityIds = [...new Set([
            ...commonRoutes.map(r => r.fromCityId),
            ...commonRoutes.map(r => r.toCityId)
          ])]
          
          const cities = await db.city.findMany({
            where: { id: { in: cityIds } }
          })

          response += "📍 مساراتك المفضلة:\n"
          for (const route of commonRoutes) {
            const fromCity = cities.find(c => c.id === route.fromCityId)
            const toCity = cities.find(c => c.id === route.toCityId)
            if (fromCity && toCity) {
              response += `• ${fromCity.nameAr || fromCity.name} → ${toCity.nameAr || toCity.name} (${route._count.id} رحلات)\n`
            }
          }
          response += "\n"
        }

        response += "💡 يمكنك:\n"
        response += "• الذهاب لصفحة 'حجز رحلة' للحجز المباشر\n"
        response += "• إخباري بالمسار المطلوب وسأساعدك\n"
        response += "• السؤال عن الأسعار لمسار معين\n\n"
        response += "📞 أو اتصل بنا: +966 53 997 7837"

        return response
      }
    }

    // Check for price inquiries with routes
    const routeMatch = message.match(/(من|from)\s*([^\s]+)\s*(إلى|الى|ل|to)\s*([^\s]+)/)
    if (routeMatch || message.includes("سعر") || message.includes("price")) {
      if (session.user.role === UserRole.CUSTOMER) {
        let response = "💰 للحصول على عرض سعر دقيق:\n\n"
        
        if (routeMatch) {
          const fromCity = routeMatch[2]
          const toCity = routeMatch[4]
          response += `📍 المسار المطلوب: ${fromCity} → ${toCity}\n\n`
        }

        // Get user's previous pricing for similar routes
        const recentTrips = await db.trip.findMany({
          where: { customerId: session.user.id },
          include: {
            fromCity: true,
            toCity: true,
            vehicle: { include: { vehicleType: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 3
        })

        if (recentTrips.length > 0) {
          response += "📊 أسعار رحلاتك السابقة:\n"
          recentTrips.forEach((trip, index) => {
            response += `• ${trip.fromCity.nameAr || trip.fromCity.name} → ${trip.toCity.nameAr || trip.toCity.name}: ${trip.price} ${trip.currency}\n`
          })
          response += "\n"
        }

        response += "🔍 العوامل المؤثرة على السعر:\n"
        response += "• المسافة والمسار\n"
        response += "• نوع المركبة المطلوبة\n"
        response += "• درجة الحرارة (عادي/مبرد/مجمد)\n"
        response += "• الوزن والحجم\n"
        response += "• التوقيت والموسم\n\n"
        response += "💡 للحصول على عرض سعر فوري، اذهب لصفحة 'حجز رحلة'"

        return response
      }
    }

    return null
  } catch (error) {
    console.error("Error in handleAdvancedQueries:", error)
    return null
  }
}

// Generate smart suggestions based on user data
async function generateSmartSuggestions(session: any) {
  try {
    const suggestions: Array<{
      type: string
      title: string
      message: string
      action: string
      priority: 'high' | 'medium' | 'low'
    }> = []

    // Skip database queries if user is not a customer or if there's no session
    if (!session || session.user.role !== UserRole.CUSTOMER) {
      return suggestions
    }

    try {
      // Check for pending trips
      const pendingTrips = await db.trip.count({
        where: { 
          customerId: session.user.id,
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'AT_DESTINATION'] }
        }
      })

      if (pendingTrips > 0) {
        suggestions.push({
          type: "action",
          title: "رحلات نشطة",
          message: `لديك ${pendingTrips} رحلة نشطة`,
          action: "رحلاتي",
          priority: "high"
        })
      }

      // Check for unpaid invoices
      const unpaidInvoices = await db.invoice.count({
        where: { 
          OR: [
            { trip: { customerId: session.user.id } },
            { customerId: session.user.id }
          ],
          paymentStatus: { in: ['PENDING', 'SENT', 'OVERDUE'] }
        }
      })

      if (unpaidInvoices > 0) {
        suggestions.push({
          type: "warning",
          title: "فواتير معلقة",
          message: `لديك ${unpaidInvoices} فاتورة تحتاج للدفع`,
          action: "فواتيري",
          priority: "high"
        })
      }

      // Check for recent notifications
      const unreadNotifications = await db.notification.count({
        where: { 
          userId: session.user.id,
          isRead: false
        }
      })

      if (unreadNotifications > 0) {
        suggestions.push({
          type: "info",
          title: "إشعارات جديدة",
          message: `لديك ${unreadNotifications} إشعار جديد`,
          action: "الإشعارات",
          priority: "medium"
        })
      }

      // Suggest booking if no recent trips
      const recentTrips = await db.trip.count({
        where: { 
          customerId: session.user.id,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      })

      if (recentTrips === 0) {
        suggestions.push({
          type: "suggestion",
          title: "حجز رحلة جديدة",
          message: "لم تحجز رحلة مؤخراً، هل تحتاج لحجز رحلة؟",
          action: "حجز رحلة",
          priority: "low"
        })
      }

      // Get most common route for quick booking
      const commonRoute = await db.trip.groupBy({
        by: ['fromCityId', 'toCityId'],
        where: { customerId: session.user.id },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1
      })

      if (commonRoute.length > 0) {
        const cities = await db.city.findMany({
          where: { id: { in: [commonRoute[0].fromCityId, commonRoute[0].toCityId] } }
        })
        
        const fromCity = cities.find(c => c.id === commonRoute[0].fromCityId)
        const toCity = cities.find(c => c.id === commonRoute[0].toCityId)
        
        if (fromCity && toCity) {
          suggestions.push({
            type: "quick_action",
            title: "مسارك المفضل",
            message: `${fromCity.nameAr || fromCity.name} → ${toCity.nameAr || toCity.name}`,
            action: `سعر من ${fromCity.nameAr || fromCity.name} إلى ${toCity.nameAr || toCity.name}`,
            priority: "medium"
          })
        }
      }
    } catch (dbError) {
      console.error("Database error in suggestions:", dbError)
      // Return empty suggestions if database fails
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

  } catch (error) {
    console.error("Error generating suggestions:", error)
    return []
  }
}

// GET - Get chat history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's recent notifications and suggestions
    const suggestions = await generateSmartSuggestions(session)
    
    return NextResponse.json({
      messages: [],
      botInfo: {
        name: "PRO FLEET Assistant",
        version: "2.0",
        capabilities: [
          "تتبع الشحنات المتقدم",
          "الاستعلام عن الأسعار الذكي", 
          "إدارة الرحلات والفواتير",
          "اقتراحات شخصية",
          "الدعم الفني المتطور"
        ]
      },
      suggestions
    })
  } catch (error) {
    console.error("Error fetching chat history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Send message to chatbot
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    const userMessage = message.toLowerCase().trim()
    let botResponse = ""

    // Check for trip number pattern (PRO format only)
    let tripNumber: string | null = null
    
    // Check for PRO format (PRO-20241224-001)
    const proMatch = userMessage.match(/pro[\-\s]?(\d{8})[\-\s]?(\d{3})/i)
    if (proMatch) {
      tripNumber = `PRO-${proMatch[1]}-${proMatch[2]}`
    }
    
    if (tripNumber) {
      try {
        // Look up the trip
        const trip = await db.trip.findFirst({
          where: { 
            tripNumber,
            customerId: session.user.role === UserRole.CUSTOMER ? session.user.id : undefined
          },
          include: {
            fromCity: true,
            toCity: true,
            vehicle: {
              include: {
                vehicleType: true
              }
            },
            driver: {
              include: {
                user: true
              }
            },
            trackingLogs: {
              orderBy: { timestamp: "desc" },
              take: 1
            }
          }
        })

        if (trip) {
          const statusText = getTripStatusArabic(trip.status)
          const vehicleInfo = trip.vehicle?.vehicleType?.name || trip.vehicle?.vehicleNumber || "غير محدد"

          botResponse = `📦 معلومات الرحلة ${tripNumber}:\n\n` +
            `🏙️ من: ${trip.fromCity.nameAr || trip.fromCity.name}\n` +
            `🏙️ إلى: ${trip.toCity.nameAr || trip.toCity.name}\n` +
            `📊 الحالة: ${statusText}\n` +
            `🚛 المركبة: ${vehicleInfo}\n` +
            `💰 السعر: ${trip.price} ${trip.currency}\n`

          if (trip.driver?.user?.name) {
            botResponse += `👨‍💼 السائق: ${trip.driver.user.name}\n`
          }

          if (trip.trackingLogs.length > 0 && (
            trip.status === TripStatus.IN_PROGRESS || 
            trip.status === TripStatus.EN_ROUTE_PICKUP ||
            trip.status === TripStatus.AT_PICKUP ||
            trip.status === TripStatus.PICKED_UP ||
            trip.status === TripStatus.IN_TRANSIT ||
            trip.status === TripStatus.AT_DESTINATION
          )) {
            const lastLocation = trip.trackingLogs[0]
            botResponse += `\n📍 آخر موقع: ${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)}\n` +
              `⏰ آخر تحديث: ${new Date(lastLocation.timestamp).toLocaleString('ar-SA')}`
            
            if (lastLocation.speed && lastLocation.speed > 0) {
              botResponse += `\n🚗 السرعة: ${lastLocation.speed.toFixed(0)} كم/ساعة`
            }
          }

          if (trip.status === TripStatus.DELIVERED && trip.deliveredDate) {
            botResponse += `\n✅ تم التسليم في: ${new Date(trip.deliveredDate).toLocaleString('ar-SA')}`
          }

          if (trip.scheduledDate) {
            botResponse += `\n📅 موعد الرحلة: ${new Date(trip.scheduledDate).toLocaleString('ar-SA')}`
          }

          if (trip.notes) {
            botResponse += `\n📝 ملاحظات: ${trip.notes}`
          }
        } else {
          botResponse = `❌ لم أجد رحلة برقم ${tripNumber}.\n\n🔍 تأكد من:\n• كتابة الرقم بشكل صحيح\n• أن الرحلة مسجلة باسمك\n\n📞 أو تواصل مع الدعم: +966 53 997 7837`
        }
      } catch (dbError) {
        console.error("Database error:", dbError)
        botResponse = `❌ لم أتمكن من البحث عن الرحلة ${tripNumber} حالياً.\n\n🔍 يرجى المحاولة مرة أخرى أو التواصل مع الدعم: +966 53 997 7837`
      }
    } else {
      // Check for advanced queries first (with error handling)
      try {
        const advancedResponse = await handleAdvancedQueries(userMessage, session)
        if (advancedResponse) {
          botResponse = advancedResponse
        } else {
          // Use enhanced response matching
          botResponse = findBestResponse(userMessage)
        }
      } catch (dbError) {
        console.error("Database error in advanced queries:", dbError)
        // Fallback to basic response matching
        botResponse = findBestResponse(userMessage)
      }
    }

    // Add user context to response
    const userRole = {
      ADMIN: "المدير",
      DRIVER: "السائق", 
      CUSTOMER: "العميل",
      ACCOUNTANT: "المحاسب",
      CUSTOMS_BROKER: "المخلص الجمركي"
    }[session.user.role] || "المستخدم"

    return NextResponse.json({
      userMessage: message,
      botResponse,
      timestamp: new Date().toISOString(),
      userRole,
      userName: session.user.name
    })
  } catch (error) {
    console.error("Error processing chat message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
