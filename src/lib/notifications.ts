import { db } from "@/lib/db"
import { NotificationType } from "@prisma/client"

interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  data
}: CreateNotificationData) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null
      }
    })

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export async function createTripStatusNotification(
  userId: string,
  tripNumber: string,
  status: string,
  tripId?: string
) {
  const statusMessages: Record<string, string> = {
    'PENDING': 'رحلتك في انتظار التعيين',
    'ASSIGNED': 'تم تعيين سائق لرحلتك',
    'IN_PROGRESS': 'رحلتك قيد التنفيذ',
    'EN_ROUTE_PICKUP': 'السائق في الطريق لنقطة الاستلام',
    'AT_PICKUP': 'السائق وصل لنقطة الاستلام',
    'PICKED_UP': 'تم استلام البضاعة',
    'IN_TRANSIT': 'البضاعة في الطريق للوجهة',
    'AT_DESTINATION': 'السائق وصل للوجهة',
    'DELIVERED': 'تم تسليم البضاعة بنجاح',
    'CANCELLED': 'تم إلغاء الرحلة'
  }

  return createNotification({
    userId,
    type: 'TRIP_STATUS_UPDATE',
    title: `تحديث حالة الرحلة ${tripNumber}`,
    message: statusMessages[status] || `تم تحديث حالة الرحلة إلى ${status}`,
    data: {
      tripId,
      tripNumber,
      status
    }
  })
}

export async function createTripAssignedNotification(
  userId: string,
  tripNumber: string,
  driverName: string,
  tripId?: string
) {
  return createNotification({
    userId,
    type: 'TRIP_ASSIGNED',
    title: `تم تعيين سائق للرحلة ${tripNumber}`,
    message: `تم تعيين السائق ${driverName} لرحلتك`,
    data: {
      tripId,
      tripNumber,
      driverName
    }
  })
}

export async function createTripCancelledNotification(
  userId: string,
  tripNumber: string,
  reason?: string,
  tripId?: string
) {
  return createNotification({
    userId,
    type: 'TRIP_CANCELLED',
    title: `تم إلغاء الرحلة ${tripNumber}`,
    message: reason || 'تم إلغاء رحلتك',
    data: {
      tripId,
      tripNumber,
      reason
    }
  })
}

export async function createInvoiceNotification(
  userId: string,
  invoiceNumber: string,
  amount: number,
  currency: string = 'SAR',
  invoiceId?: string
) {
  return createNotification({
    userId,
    type: 'INVOICE_CREATED',
    title: `فاتورة جديدة ${invoiceNumber}`,
    message: `تم إنشاء فاتورة بقيمة ${amount} ${currency}`,
    data: {
      invoiceId,
      invoiceNumber,
      amount,
      currency
    }
  })
}

export async function createPaymentNotification(
  userId: string,
  invoiceNumber: string,
  amount: number,
  currency: string = 'SAR',
  paymentId?: string
) {
  return createNotification({
    userId,
    type: 'PAYMENT_RECEIVED',
    title: `تم استلام دفعة للفاتورة ${invoiceNumber}`,
    message: `تم استلام دفعة بقيمة ${amount} ${currency}`,
    data: {
      paymentId,
      invoiceNumber,
      amount,
      currency
    }
  })
}

export async function createDriverResponseNotification(
  userId: string,
  tripNumber: string,
  driverName: string,
  accepted: boolean,
  tripId?: string
) {
  return createNotification({
    userId,
    type: accepted ? 'DRIVER_ACCEPTED' : 'DRIVER_REJECTED',
    title: accepted 
      ? `السائق ${driverName} قبل الرحلة ${tripNumber}`
      : `السائق ${driverName} رفض الرحلة ${tripNumber}`,
    message: accepted
      ? `قبل السائق ${driverName} تنفيذ رحلتك`
      : `رفض السائق ${driverName} تنفيذ رحلتك. سيتم البحث عن سائق آخر.`,
    data: {
      tripId,
      tripNumber,
      driverName,
      accepted
    }
  })
}

export async function createSystemAnnouncementNotification(
  userId: string,
  title: string,
  message: string,
  data?: any
) {
  return createNotification({
    userId,
    type: 'SYSTEM_ANNOUNCEMENT',
    title,
    message,
    data
  })
}

export async function createCustomsUpdateNotification(
  userId: string,
  clearanceNumber: string,
  status: string,
  clearanceId?: string
) {
  return createNotification({
    userId,
    type: 'CUSTOMS_UPDATE',
    title: `تحديث التخليص الجمركي ${clearanceNumber}`,
    message: `تم تحديث حالة التخليص الجمركي إلى ${status}`,
    data: {
      clearanceId,
      clearanceNumber,
      status
    }
  })
}

// Get unread notifications count for a user
export async function getUnreadNotificationsCount(userId: string) {
  try {
    const count = await db.notification.count({
      where: {
        userId,
        isRead: false
      }
    })
    return count
  } catch (error) {
    console.error("Error getting unread notifications count:", error)
    return 0
  }
}
