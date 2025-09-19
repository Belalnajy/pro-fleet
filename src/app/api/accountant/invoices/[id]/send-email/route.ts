import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: invoiceId } = await params
    const body = await request.json()
    const { recipientEmail, subject, message } = body

    // Get invoice details
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        trip: {
          include: {
            customer: {
              select: { name: true, email: true, phone: true }
            },
            fromCity: { select: { name: true, nameAr: true } },
            toCity: { select: { name: true, nameAr: true } },
            driver: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // In a real implementation, you would use an email service like:
    // - Nodemailer with SMTP
    // - SendGrid API
    // - AWS SES
    // - Resend
    // - Mailgun
    
    const emailData = {
      to: recipientEmail || invoice.trip?.customer?.email,
      subject: subject || `فاتورة رقم ${invoice.invoiceNumber} - شركة ProFleet`,
      html: generateInvoiceEmailHTML(invoice, message),
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          // In real implementation, you would generate and attach the actual PDF
          content: 'PDF content would go here'
        }
      ]
    }

    // Simulate email sending
    const emailResult = await sendEmail(emailData)
    
    if (!emailResult.success) {
      throw new Error(emailResult.error)
    }

    // Update invoice to mark as sent
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        // In a real schema, you might have a 'sentDate' or 'emailSentAt' field
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم إرسال الفاتورة بالبريد الإلكتروني بنجاح',
      sentTo: emailData.to
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

// Generate HTML email template
function generateInvoiceEmailHTML(invoice: any, customMessage?: string): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .invoice-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
          border-bottom: none;
          font-weight: bold;
          font-size: 1.1em;
          color: #667eea;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>شركة ProFleet للنقل</h1>
        <p>فاتورة رقم: ${invoice.invoiceNumber}</p>
      </div>
      
      <div class="content">
        <h2>عزيزي/عزيزتي ${invoice.trip?.customer?.name}</h2>
        
        ${customMessage ? `<p>${customMessage}</p>` : `
        <p>نتشرف بإرسال فاتورة الخدمات المقدمة لكم. يرجى مراجعة التفاصيل أدناه:</p>
        `}
        
        <div class="invoice-details">
          <div class="detail-row">
            <span>رقم الفاتورة:</span>
            <span>${invoice.invoiceNumber}</span>
          </div>
          <div class="detail-row">
            <span>رقم الرحلة:</span>
            <span>${invoice.trip?.tripNumber || 'غير محدد'}</span>
          </div>
          <div class="detail-row">
            <span>المسار:</span>
            <span>${invoice.trip?.fromCity?.nameAr || invoice.trip?.fromCity?.name} → ${invoice.trip?.toCity?.nameAr || invoice.trip?.toCity?.name}</span>
          </div>
          <div class="detail-row">
            <span>السائق:</span>
            <span>${invoice.trip?.driver?.user?.name || 'غير محدد'}</span>
          </div>
          <div class="detail-row">
            <span>المبلغ الفرعي:</span>
            <span>${invoice.subtotal.toLocaleString()} ريال</span>
          </div>
          <div class="detail-row">
            <span>الضريبة:</span>
            <span>${invoice.taxAmount.toLocaleString()} ريال</span>
          </div>
          <div class="detail-row">
            <span>رسوم الجمارك:</span>
            <span>${invoice.customsFee.toLocaleString()} ريال</span>
          </div>
          <div class="detail-row">
            <span>المبلغ الإجمالي:</span>
            <span>${invoice.total.toLocaleString()} ريال</span>
          </div>
        </div>
        
        <p><strong>تاريخ الاستحقاق:</strong> ${new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</p>
        
        <p>يرجى سداد المبلغ المستحق في الموعد المحدد. في حالة وجود أي استفسارات، لا تترددوا في التواصل معنا.</p>
        
        <div class="footer">
          <p>شكراً لكم لاختيار خدماتنا</p>
          <p>شركة ProFleet للنقل</p>
          <p>البريد الإلكتروني: info@profleet.com | الهاتف: +966 11 123 4567</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Simulate email sending (in real implementation, use actual email service)
async function sendEmail(emailData: any): Promise<{ success: boolean; error?: string }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // In a real implementation, you would use an email service:
  /*
  try {
    // Example with Nodemailer:
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
    
    await transporter.sendMail(emailData)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
  */
  
  // For demo purposes, always return success
  console.log('Simulated email sent:', emailData)
  return { success: true }
}
