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
  
  // Goodbye
  goodbye: {
    patterns: ["bye", "goodbye", "مع السلامة", "وداعا", "شكرا", "thanks", "thank you"],
    responses: [
      "شكراً لك! 🙏\nأتمنى أن أكون قد ساعدتك\nلا تتردد في العودة إلي في أي وقت",
      "مع السلامة! 👋\nكان من دواعي سروري مساعدتك\nPRO FLEET في خدمتك دائماً"
    ]
  }
}

// Enhanced response matching function
function findBestResponse(userMessage: string): string {
  const message = userMessage.toLowerCase().trim()
  
  // Check each category
  for (const [category, data] of Object.entries(chatbotResponses)) {
    for (const pattern of data.patterns) {
      if (message.includes(pattern.toLowerCase())) {
        const responses = data.responses
        return responses[Math.floor(Math.random() * responses.length)]
      }
    }
  }
  
  // Default response with helpful suggestions
  return "🤔 عذراً، لم أفهم سؤالك تماماً.\n\n💡 يمكنك السؤال عن:\n• تتبع الشحنات (أدخل رقم الرحلة)\n• الأسعار والتكاليف\n• حجز رحلة جديدة\n• خدماتنا ومعلومات الشركة\n• الدعم والمساعدة\n\n📞 أو تواصل مباشرة: +966 53 997 7837"
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

// GET - Get chat history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, return empty array as we're not storing chat history
    // In a real implementation, you'd store messages in database
    return NextResponse.json({
      messages: [],
      botInfo: {
        name: "PRO FLEET Assistant",
        version: "1.0",
        capabilities: [
          "تتبع الشحنات",
          "الاستعلام عن الأسعار", 
          "حالة الرحلات",
          "الدعم الفني"
        ]
      }
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

        if (trip.estimatedDeliveryDate) {
          botResponse += `\n📅 التسليم المتوقع: ${new Date(trip.estimatedDeliveryDate).toLocaleString('ar-SA')}`
        }

        if (trip.notes) {
          botResponse += `\n📝 ملاحظات: ${trip.notes}`
        }
      } else {
        botResponse = `❌ لم أجد رحلة برقم ${tripNumber}.\n\n🔍 تأكد من:\n• كتابة الرقم بشكل صحيح\n• أن الرحلة مسجلة باسمك\n\n📞 أو تواصل مع الدعم: +966 53 997 7837`
      }
    } else {
      // Use enhanced response matching
      botResponse = findBestResponse(userMessage)
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
