const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleNotifications() {
  try {
    console.log('🔔 Creating sample notifications...')

    // Get a customer user
    const customer = await prisma.user.findFirst({
      where: {
        role: 'CUSTOMER'
      }
    })

    if (!customer) {
      console.log('❌ No customer found. Please run the seed script first.')
      return
    }

    console.log(`📧 Creating notifications for customer: ${customer.name}`)

    // Create various types of notifications
    const notifications = [
      {
        userId: customer.id,
        type: 'TRIP_STATUS_UPDATE',
        title: 'تحديث حالة الرحلة PRO-20250125-001',
        message: 'تم تعيين سائق لرحلتك وهو في الطريق لنقطة الاستلام',
        data: {
          tripId: 'sample-trip-1',
          tripNumber: 'PRO-20250125-001',
          status: 'EN_ROUTE_PICKUP'
        }
      },
      {
        userId: customer.id,
        type: 'INVOICE_CREATED',
        title: 'فاتورة جديدة INV-20250125-001',
        message: 'تم إنشاء فاتورة بقيمة 1,500 ريال سعودي',
        data: {
          invoiceId: 'sample-invoice-1',
          invoiceNumber: 'INV-20250125-001',
          amount: 1500,
          currency: 'SAR'
        }
      },
      {
        userId: customer.id,
        type: 'DRIVER_ACCEPTED',
        title: 'السائق أحمد محمد قبل الرحلة PRO-20250125-002',
        message: 'قبل السائق أحمد محمد تنفيذ رحلتك وسيبدأ التحرك قريباً',
        data: {
          tripId: 'sample-trip-2',
          tripNumber: 'PRO-20250125-002',
          driverName: 'أحمد محمد',
          accepted: true
        }
      },
      {
        userId: customer.id,
        type: 'TRIP_CANCELLED',
        title: 'تم إلغاء الرحلة PRO-20250124-003',
        message: 'تم إلغاء الرحلة مع رسوم إلغاء 300 ريال',
        data: {
          tripId: 'sample-trip-3',
          tripNumber: 'PRO-20250124-003',
          reason: 'تم إلغاء الرحلة مع رسوم إلغاء 300 ريال'
        }
      },
      {
        userId: customer.id,
        type: 'PAYMENT_RECEIVED',
        title: 'تم استلام دفعة للفاتورة INV-20250120-001',
        message: 'تم استلام دفعة بقيمة 2,000 ريال سعودي',
        data: {
          paymentId: 'sample-payment-1',
          invoiceNumber: 'INV-20250120-001',
          amount: 2000,
          currency: 'SAR'
        }
      },
      {
        userId: customer.id,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'إعلان هام من النظام',
        message: 'تم تحديث النظام بميزات جديدة لتحسين تجربة المستخدم',
        data: {
          type: 'system_update',
          version: '2.1.0'
        }
      },
      {
        userId: customer.id,
        type: 'CUSTOMS_UPDATE',
        title: 'تحديث التخليص الجمركي CL-000001',
        message: 'تم تحديث حالة التخليص الجمركي إلى "قيد المراجعة"',
        data: {
          clearanceId: 'sample-clearance-1',
          clearanceNumber: 'CL-000001',
          status: 'قيد المراجعة'
        }
      }
    ]

    // Create notifications with different read states and timestamps
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i]
      
      // Make some notifications read and some unread
      const isRead = i % 3 === 0 // Every third notification is read
      
      // Create notifications with different timestamps (spread over last 7 days)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - (i % 7))
      createdAt.setHours(createdAt.getHours() - (i * 2))

      await prisma.notification.create({
        data: {
          ...notification,
          isRead,
          createdAt
        }
      })

      console.log(`✅ Created notification: ${notification.title} (${isRead ? 'Read' : 'Unread'})`)
    }

    console.log('🎉 Sample notifications created successfully!')
    console.log(`📊 Total notifications created: ${notifications.length}`)
    console.log(`📖 Read notifications: ${notifications.filter((_, i) => i % 3 === 0).length}`)
    console.log(`📬 Unread notifications: ${notifications.filter((_, i) => i % 3 !== 0).length}`)

  } catch (error) {
    console.error('❌ Error creating sample notifications:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleNotifications()
