import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PaymentStatus } from "@prisma/client"
import nodemailer from "nodemailer"

// POST /api/admin/invoices/[id]/send-email - Send invoice via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log('=== EMAIL API START ===', { invoiceId: id })
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            customer: true, // customer is User directly
            fromCity: true,
            toCity: true,
            driver: {
              include: {
                user: true
              }
            },
            vehicle: {
              include: {
                vehicleType: true
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (!invoice.trip?.customer?.email) {
      return NextResponse.json({ error: "Customer email not found" }, { status: 400 })
    }

    // Validate SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP configuration missing:', {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Missing',
        SMTP_PASS: process.env.SMTP_PASS ? 'Set' : 'Missing'
      })
      return NextResponse.json({ 
        error: "SMTP configuration is incomplete. Please check environment variables." 
      }, { status: 500 })
    }

    // Create email transporter (configure with your SMTP settings)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    })

    // Test the connection
    try {
      await transporter.verify()
      console.log('SMTP connection verified successfully')
    } catch (verifyError) {
      console.error('SMTP connection failed:', verifyError)
      return NextResponse.json({ 
        error: "SMTP connection failed. Please check your email configuration.",
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }, { status: 500 })
    }

    // Email content
    const emailHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoice.invoiceNumber}</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                direction: rtl;
                margin: 0;
                padding: 20px;
                background-color: #f8f9fa;
                color: #333;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #3b82f6, #1e40af);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #374151;
            }
            .invoice-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
                border-right: 4px solid #3b82f6;
            }
            .invoice-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 5px 0;
            }
            .invoice-row:last-child {
                margin-bottom: 0;
                font-weight: bold;
                font-size: 18px;
                color: #059669;
                border-top: 1px solid #d1d5db;
                padding-top: 15px;
                margin-top: 15px;
            }
            .label {
                font-weight: 600;
                color: #374151;
            }
            .value {
                color: #6b7280;
            }
            .trip-info {
                background: #eff6ff;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
            }
            .trip-title {
                font-size: 16px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 15px;
            }
            .button {
                display: inline-block;
                background: #3b82f6;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
            }
            .footer {
                background: #f3f4f6;
                padding: 20px;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                margin-right: 10px;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>برو فليت</h1>
                <p>فاتورة رقم: ${invoice.invoiceNumber}</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    عزيزي/عزيزتي ${invoice.trip?.customer?.name},
                </div>
                
                <p>نتشرف بإرسال فاتورتكم الخاصة بخدمات النقل. يرجى مراجعة التفاصيل أدناه:</p>
                
                <div class="invoice-details">
                    <div class="invoice-row">
                        <span class="label">رقم الفاتورة:</span>
                        <span class="value">${invoice.invoiceNumber}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">تاريخ الإصدار:</span>
                        <span class="value">${new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">تاريخ الاستحقاق:</span>
                        <span class="value">${new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">الحالة:</span>
                        <span class="value">
                            <span class="status-badge status-${invoice.paymentStatus.toLowerCase()}">
                                ${invoice.paymentStatus === 'PENDING' ? 'في الانتظار' : 
                                  invoice.paymentStatus === 'PAID' ? 'مدفوعة' : 
                                  invoice.paymentStatus === 'OVERDUE' ? 'متأخرة' : 'ملغية'}
                            </span>
                        </span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">المبلغ الفرعي:</span>
                        <span class="value">${invoice.subtotal.toFixed(2)} ${invoice.currency}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">ضريبة القيمة المضافة:</span>
                        <span class="value">${invoice.taxAmount.toFixed(2)} ${invoice.currency}</span>
                    </div>
                    ${invoice.customsFee > 0 ? `
                    <div class="invoice-row">
                        <span class="label">الرسوم الجمركية:</span>
                        <span class="value">${invoice.customsFee.toFixed(2)} ${invoice.currency}</span>
                    </div>
                    ` : ''}
                    <div class="invoice-row">
                        <span class="label">المجموع الإجمالي:</span>
                        <span class="value">${invoice.total.toFixed(2)} ${invoice.currency}</span>
                    </div>
                </div>

                ${invoice.trip ? `
                <div class="trip-info">
                    <div class="trip-title">تفاصيل الرحلة</div>
                    <div class="invoice-row">
                        <span class="label">رقم الرحلة:</span>
                        <span class="value">${invoice.trip.tripNumber}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">المسار:</span>
                        <span class="value">${invoice.trip.fromCity?.name} → ${invoice.trip.toCity?.name}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="label">السائق:</span>
                        <span class="value">${invoice.trip.driver?.user?.name || 'غير محدد'}</span>
                    </div>
                </div>
                ` : ''}

                <p>يمكنكم تحميل نسخة PDF من الفاتورة من خلال النقر على الرابط أدناه:</p>
                
                <a href="${process.env.NEXTAUTH_URL}/api/admin/invoices/${invoice.id}/pdf" class="button">
                    تحميل الفاتورة PDF
                </a>

                <p>في حالة وجود أي استفسارات، يرجى التواصل معنا على:</p>
                <ul>
                    <li>الهاتف: +966 11 123 4567</li>
                    <li>البريد الإلكتروني: billing@profleet.com</li>
                </ul>

                <p>شكراً لاختياركم خدماتنا.</p>
            </div>
            
            <div class="footer">
                <p><strong>شركة برو فليت للنقل والخدمات اللوجستية</strong></p>
                <p>المملكة العربية السعودية | الرقم الضريبي: 123456789000003</p>
                <p>هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه مباشرة</p>
            </div>
        </div>
    </body>
    </html>
    `

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || `"برو فليت" <${process.env.SMTP_USER}>`,
      to: invoice.trip.customer.email,
      subject: `فاتورة رقم ${invoice.invoiceNumber} - برو فليت`,
      html: emailHtml,
    }

    console.log('Attempting to send email:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    })

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', info.messageId)
      
      // Update invoice to mark as sent (only if currently PENDING)
      if (invoice.paymentStatus === PaymentStatus.PENDING) {
        await db.invoice.update({
          where: { id },
          data: { 
            paymentStatus: 'SENT' as any // Force type since SENT exists in schema
          }
        })
      }

      return NextResponse.json({ 
        message: "Invoice sent successfully",
        email: invoice.trip.customer.email,
        messageId: info.messageId
      })
    } catch (emailError) {
      console.error("Detailed email error:", {
        error: emailError,
        code: emailError instanceof Error ? (emailError as any).code : 'Unknown',
        response: emailError instanceof Error ? (emailError as any).response : 'No response'
      })
      
      let errorMessage = "Failed to send email."
      if (emailError instanceof Error) {
        if ((emailError as any).code === 'EAUTH') {
          errorMessage = "Email authentication failed. Please check your email credentials."
        } else if ((emailError as any).code === 'ECONNECTION') {
          errorMessage = "Cannot connect to email server. Please check your network connection."
        } else {
          errorMessage = `Email error: ${emailError.message}`
        }
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error("=== EMAIL API ERROR ===", {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      invoiceId: id
    })
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
