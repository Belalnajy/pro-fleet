import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

// Simple chatbot responses for fleet management
const chatbotResponses = {
  // Greetings
  "hello": "مرحباً! أنا مساعد PRO FLEET الذكي. كيف يمكنني مساعدتك اليوم؟",
  "hi": "أهلاً وسهلاً! كيف يمكنني خدمتك؟",
  "مرحبا": "مرحباً بك! أنا هنا لمساعدتك في أي استفسار حول خدمات النقل.",
  
  // Trip related
  "trip": "يمكنني مساعدتك في:\n• تتبع الشحنات\n• حالة الرحلات\n• جدولة رحلة جديدة\n• معلومات الأسعار",
  "track": "لتتبع شحنتك، يرجى إدخال رقم الرحلة (مثل: TWB:5001)",
  "تتبع": "لتتبع شحنتك، أدخل رقم الرحلة أو اذهب لصفحة 'تتبع الشحنات'",
  "رحلة": "يمكنك إنشاء رحلة جديدة من صفحة 'حجز رحلة' أو الاستعلام عن الرحلات الحالية",
  
  // Pricing
  "price": "أسعارنا تختلف حسب:\n• المسافة والوجهة\n• نوع المركبة\n• درجة الحرارة المطلوبة\nيمكنك طلب عرض سعر من صفحة 'حجز رحلة'",
  "سعر": "للاستعلام عن الأسعار، حدد المدينة المرسل منها والمستقبلة ونوع المركبة",
  
  // Status
  "status": "يمكنك معرفة حالة رحلتك من خلال:\n• صفحة تتبع الشحنات\n• إدخال رقم الرحلة هنا\n• التحديثات التلقائية عبر الإشعارات",
  "حالة": "لمعرفة حالة الشحنة، أدخل رقم الرحلة أو تفقد صفحة 'رحلاتي'",
  
  // Support
  "help": "يمكنني مساعدتك في:\n• تتبع الشحنات\n• الاستعلام عن الأسعار\n• حالة الرحلات\n• معلومات الحساب\n• الدعم الفني",
  "مساعدة": "أنا هنا لمساعدتك! اسأل عن أي شيء متعلق بخدمات النقل والشحن",
  
  // Default
  "default": "عذراً، لم أفهم سؤالك. يمكنك السؤال عن:\n• تتبع الشحنات\n• الأسعار\n• حالة الرحلات\n• المساعدة\nأو تواصل مع فريق الدعم: +966500000000"
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
    let botResponse = chatbotResponses.default

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
          vehicle: true,
          trackingLogs: {
            orderBy: { timestamp: "desc" },
            take: 1
          }
        }
      })

      if (trip) {
        const statusText = {
          PENDING: "في الانتظار",
          IN_PROGRESS: "قيد التنفيذ", 
          DELIVERED: "تم التسليم",
          CANCELLED: "ملغية"
        }[trip.status] || trip.status

        botResponse = `📦 معلومات الرحلة ${tripNumber}:\n\n` +
          `🏙️ من: ${trip.fromCity.nameAr || trip.fromCity.name}\n` +
          `🏙️ إلى: ${trip.toCity.nameAr || trip.toCity.name}\n` +
          `📊 الحالة: ${statusText}\n` +
          `🚛 نوع المركبة: ${trip.vehicle.capacity}\n` +
          `💰 السعر: ${trip.price} ${trip.currency}\n`

        if (trip.trackingLogs.length > 0 && trip.status === "IN_PROGRESS") {
          const lastLocation = trip.trackingLogs[0]
          botResponse += `\n📍 آخر موقع: ${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)}\n` +
            `⏰ آخر تحديث: ${new Date(lastLocation.timestamp).toLocaleString('ar-SA')}`
        }

        if (trip.status === "DELIVERED" && trip.deliveredDate) {
          botResponse += `\n✅ تم التسليم في: ${new Date(trip.deliveredDate).toLocaleString('ar-SA')}`
        }
      } else {
        botResponse = `❌ لم أجد رحلة برقم ${tripNumber}. تأكد من رقم الرحلة أو تواصل مع الدعم.`
      }
    } else {
      // Check for keyword matches
      for (const [keyword, response] of Object.entries(chatbotResponses)) {
        if (keyword !== "default" && userMessage.includes(keyword)) {
          botResponse = response
          break
        }
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
