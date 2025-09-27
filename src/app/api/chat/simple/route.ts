import { NextRequest, NextResponse } from "next/server"

// Simple chatbot responses without database
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
    patterns: ["track", "تتبع", "tracking", "موقع", "location", "أين", "where", "pro-"],
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
  
  // Contact
  contact: {
    patterns: ["contact", "تواصل", "اتصال", "رقم", "phone", "email", "بريد"],
    responses: [
      "📞 طرق التواصل معنا:\n• الهاتف: +966 53 997 7837\n• الرقم الموحد: 8002440411\n• البريد الإلكتروني: info@profleet.app\n• الموقع: www.profleet.app\n\n📍 العنوان: الرياض، المملكة العربية السعودية\n⏰ خدمة العملاء: 24/7"
    ]
  },
  
  // Support
  support: {
    patterns: ["help", "مساعدة", "support", "دعم", "مشكلة", "problem", "issue"],
    responses: [
      "🆘 كيف يمكنني مساعدتك؟\n• تتبع الشحنات والرحلات\n• الاستعلام عن الأسعار\n• حجز رحلة جديدة\n• مشاكل تقنية\n• استفسارات عامة\n\n📞 للدعم الفوري: +966 53 997 7837\n⏰ متاحون 24/7"
    ]
  },
  
  // Goodbye
  goodbye: {
    patterns: ["bye", "goodbye", "مع السلامة", "وداعا", "شكرا", "thanks", "thank you"],
    responses: [
      "شكراً لك! 🙏\nأتمنى أن أكون قد ساعدتك\nلا تتردد في العودة إلي في أي وقت",
      "مع السلامة! 👋\nكان من دواعي سروري مساعدتك\nPRO FLEET في خدمتك دائماً"
    ]
  },
  
  // Booking and orders
  booking: {
    patterns: ["حجز", "طلب", "أريد", "book", "order", "احتاج", "عايز"],
    responses: [
      "📋 لحجز رحلة جديدة:\n• اذهب لصفحة 'حجز رحلة'\n• حدد نقطة الانطلاق والوجهة\n• اختر نوع المركبة ودرجة الحرارة\n• احصل على عرض سعر فوري\n• أكمل الحجز بخطوات بسيطة\n\n🚀 أو تواصل معنا: +966 53 997 7837"
    ]
  },
  
  // Vehicle types
  vehicles: {
    patterns: ["مركبة", "شاحنة", "سيارة", "vehicle", "truck", "car", "نقل", "transport"],
    responses: [
      "🚛 أنواع المركبات المتاحة:\n• شاحنات صغيرة (1-3 طن)\n• شاحنات متوسطة (3-7 طن)\n• شاحنات كبيرة (7-15 طن)\n• شاحنات عملاقة (+15 طن)\n• مركبات مبردة ومجمدة\n• مركبات متخصصة\n\n📏 نختار المركبة المناسبة حسب حجم ووزن شحنتك"
    ]
  },
  
  // Temperature services
  temperature: {
    patterns: ["مبرد", "مجمد", "تبريد", "حرارة", "temperature", "cold", "frozen", "refrigerated"],
    responses: [
      "❄️ خدمات التحكم بالحرارة:\n• 🌡️ النقل العادي (حرارة الجو)\n• ❄️ النقل المبرد (2-8°م)\n• 🧊 النقل المجمد (-18°م)\n• 🌡️ درجات حرارة مخصصة\n\n🥗 مثالي للأغذية والأدوية والمنتجات الحساسة"
    ]
  },
  
  // Customs clearance
  customs: {
    patterns: ["جمارك", "تخليص", "customs", "clearance", "استيراد", "تصدير", "import", "export"],
    responses: [
      "🛃 خدمات التخليص الجمركي:\n• تخليص البضائع المستوردة\n• إنهاء الإجراءات الجمركية\n• تقديم المستندات المطلوبة\n• متابعة مع الجهات المختصة\n• خبراء متخصصون\n\n📋 نسهل عليك جميع الإجراءات الجمركية"
    ]
  },
  
  // Problems and complaints
  problems: {
    patterns: ["مشكلة", "شكوى", "خطأ", "problem", "issue", "complaint", "error", "تأخير", "delay"],
    responses: [
      "😔 نأسف لأي مشكلة واجهتك!\n\n🔧 للمساعدة الفورية:\n• اتصل بنا: +966 53 997 7837\n• أرسل بريد: info@profleet.app\n• تواصل عبر الموقع\n\n⏰ فريق الدعم متاح 24/7\n🎯 نحن ملتزمون بحل جميع المشاكل بسرعة"
    ]
  }
}

// Enhanced response matching function
function findBestResponse(userMessage: string): string {
  const message = userMessage.toLowerCase().trim()
  
  // Check for trip number pattern first
  const proMatch = message.match(/pro[\-\s]?(\d{8})[\-\s]?(\d{3})/i)
  if (proMatch) {
    const tripNumber = `PRO-${proMatch[1]}-${proMatch[2]}`
    return `📦 البحث عن الرحلة ${tripNumber}...\n\n🔍 للحصول على معلومات مفصلة عن الرحلة:\n• تأكد من تسجيل الدخول\n• اذهب لصفحة 'تتبع الشحنات'\n• أو اذهب لصفحة 'رحلاتي'\n\n📞 للمساعدة: +966 53 997 7837`
  }
  
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
  
  // Handle specific keywords that might not be in main patterns
  const specificKeywords = {
    "فاتورة": "💰 للاستعلام عن الفواتير:\n• اذهب لصفحة 'فواتيري'\n• تابع حالة الدفع\n• حمل الفاتورة PDF\n• سجل دفعة جديدة\n\n📞 للمساعدة: +966 53 997 7837",
    "دفع": "💳 طرق الدفع المتاحة:\n• الدفع النقدي\n• التحويل البنكي\n• البطاقات الائتمانية\n• المحافظ الرقمية\n• الدفع بالأقساط\n\n💰 دفع آمن ومضمون",
    "سائق": "👨‍💼 معلومات السائقين:\n• سائقون مدربون ومؤهلون\n• خبرة واسعة في النقل\n• تتبع مباشر للموقع\n• التزام بالمواعيد\n• خدمة احترافية\n\n🚛 أفضل السائقين في المملكة",
    "أمان": "🛡️ ضمانات الأمان:\n• تأمين شامل على البضائع\n• سائقون مؤهلون ومدربون\n• مركبات حديثة ومفحوصة\n• تتبع مباشر 24/7\n• خدمة عملاء مستمرة\n\n✅ أمانك وأمان بضائعك أولويتنا"
  }
  
  for (const [keyword, response] of Object.entries(specificKeywords)) {
    if (message.includes(keyword)) {
      return response
    }
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

// POST - Send message to simple chatbot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Get bot response
    const botResponse = findBestResponse(message)

    return NextResponse.json({
      botResponse,
      timestamp: new Date().toISOString(),
      userRole: "مستخدم",
      userName: "ضيف"
    })

  } catch (error) {
    console.error("Error in simple chat:", error)
    return NextResponse.json(
      { 
        botResponse: "❌ عذراً، حدث خطأ مؤقت.\n\n🔄 يرجى المحاولة مرة أخرى\n📞 أو تواصل معنا: +966 53 997 7837",
        timestamp: new Date().toISOString(),
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}

// GET - Get simple bot info
export async function GET() {
  return NextResponse.json({
    botInfo: {
      name: "PRO FLEET Assistant",
      version: "2.0 Simple",
      capabilities: [
        "تتبع الشحنات الأساسي",
        "الاستعلام عن الأسعار", 
        "معلومات الشركة والخدمات",
        "الدعم والمساعدة"
      ]
    },
    suggestions: [
      {
        type: "tracking",
        title: "تتبع الشحنة",
        message: "أدخل رقم الرحلة للتتبع",
        action: "PRO-20241224-001",
        priority: "high"
      },
      {
        type: "pricing", 
        title: "الأسعار",
        message: "استعلم عن أسعار النقل",
        action: "الأسعار",
        priority: "medium"
      },
      {
        type: "booking",
        title: "حجز رحلة",
        message: "احجز رحلة جديدة الآن",
        action: "أريد حجز رحلة",
        priority: "high"
      },
      {
        type: "vehicles",
        title: "أنواع المركبات",
        message: "تعرف على أنواع المركبات",
        action: "أنواع المركبات",
        priority: "medium"
      },
      {
        type: "support",
        title: "الدعم الفني",
        message: "احصل على المساعدة",
        action: "أحتاج مساعدة",
        priority: "low"
      }
    ]
  })
}
