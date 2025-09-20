import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import puppeteer from "puppeteer"

// GET /api/admin/invoices/[id]/pdf - Generate PDF for invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        trip: {
          include: {
            customer: true,
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

    // Generate HTML content for PDF
    const htmlContent = `
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
            }
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 20px;
            }
            .company-info {
                text-align: right;
            }
            .company-name {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 5px;
            }
            .company-details {
                color: #6b7280;
                font-size: 14px;
            }
            .invoice-info {
                text-align: left;
            }
            .invoice-number {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 5px;
            }
            .invoice-date {
                color: #6b7280;
                font-size: 14px;
            }
            .billing-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 40px;
            }
            .billing-section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 6px;
            }
            .billing-title {
                font-size: 16px;
                font-weight: bold;
                color: #374151;
                margin-bottom: 15px;
                border-bottom: 1px solid #d1d5db;
                padding-bottom: 5px;
            }
            .billing-details {
                color: #4b5563;
                line-height: 1.6;
            }
            .trip-details {
                margin-bottom: 30px;
                background: #eff6ff;
                padding: 20px;
                border-radius: 6px;
                border-right: 4px solid #3b82f6;
            }
            .trip-title {
                font-size: 18px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 15px;
            }
            .trip-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            .trip-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
            }
            .trip-label {
                font-weight: 600;
                color: #374151;
            }
            .trip-value {
                color: #6b7280;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                background: white;
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .items-table th {
                background: #f3f4f6;
                padding: 15px;
                text-align: right;
                font-weight: 600;
                color: #374151;
                border-bottom: 1px solid #d1d5db;
            }
            .items-table td {
                padding: 15px;
                border-bottom: 1px solid #e5e7eb;
                color: #4b5563;
            }
            .items-table tr:last-child td {
                border-bottom: none;
            }
            .totals {
                background: #f9fafb;
                padding: 25px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .total-row:last-child {
                border-bottom: none;
                font-size: 18px;
                font-weight: bold;
                color: #059669;
                background: #ecfdf5;
                padding: 15px;
                margin: 10px -25px -25px -25px;
                border-radius: 0 0 6px 6px;
            }
            .total-label {
                font-weight: 600;
                color: #374151;
            }
            .total-value {
                font-weight: 600;
                color: #1f2937;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            .status-cancelled { background: #f3f4f6; color: #374151; }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="company-info">
                    <div class="company-name">برو فليت</div>
                    <div class="company-details">
                        شركة النقل والخدمات اللوجستية<br>
                        المملكة العربية السعودية<br>
                        هاتف: +966 11 123 4567<br>
                        البريد الإلكتروني: info@profleet.com
                    </div>
                </div>
                <div class="invoice-info">
                    <div class="invoice-number">فاتورة رقم: ${invoice.invoiceNumber}</div>
                    <div class="invoice-date">تاريخ الإصدار: ${new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</div>
                    <div class="invoice-date">تاريخ الاستحقاق: ${new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</div>
                    <div style="margin-top: 10px;">
                        <span class="status-badge status-${invoice.paymentStatus.toLowerCase()}">
                            ${invoice.paymentStatus === 'PENDING' ? 'في الانتظار' : 
                              invoice.paymentStatus === 'PAID' ? 'مدفوعة' : 
                              invoice.paymentStatus === 'OVERDUE' ? 'متأخرة' : 'ملغية'}
                        </span>
                    </div>
                </div>
            </div>

            <div class="billing-info">
                <div class="billing-section">
                    <div class="billing-title">بيانات العميل</div>
                    <div class="billing-details">
                        <strong>${invoice.trip?.customer?.name || 'عميل غير محدد'}</strong><br>
                        ${invoice.trip?.customer?.email || ''}<br>
                        ${invoice.trip?.customer?.phone || ''}
                    </div>
                </div>
                <div class="billing-section">
                    <div class="billing-title">بيانات الشركة</div>
                    <div class="billing-details">
                        <strong>شركة برو فليت للنقل</strong><br>
                        الرياض، المملكة العربية السعودية<br>
                        الرقم الضريبي: 123456789000003
                    </div>
                </div>
            </div>

            ${invoice.trip ? `
            <div class="trip-details">
                <div class="trip-title">تفاصيل الرحلة</div>
                <div class="trip-info">
                    <div class="trip-item">
                        <span class="trip-label">رقم الرحلة:</span>
                        <span class="trip-value">${invoice.trip.tripNumber}</span>
                    </div>
                    <div class="trip-item">
                        <span class="trip-label">المسار:</span>
                        <span class="trip-value">${invoice.trip.fromCity?.name} → ${invoice.trip.toCity?.name}</span>
                    </div>
                    <div class="trip-item">
                        <span class="trip-label">السائق:</span>
                        <span class="trip-value">${invoice.trip.driver?.user?.name || 'غير محدد'}</span>
                    </div>
                    <div class="trip-item">
                        <span class="trip-label">المركبة:</span>
                        <span class="trip-value">${invoice.trip.vehicle?.vehicleType?.nameAr || 'غير محدد'}</span>
                    </div>
                </div>
            </div>
            ` : ''}

            <table class="items-table">
                <thead>
                    <tr>
                        <th>الوصف</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>خدمة النقل${invoice.trip ? ` - ${invoice.trip.tripNumber}` : ''}</td>
                        <td>1</td>
                        <td>${invoice.subtotal.toFixed(2)} ${invoice.currency}</td>
                        <td>${invoice.subtotal.toFixed(2)} ${invoice.currency}</td>
                    </tr>
                    ${invoice.customsFee > 0 ? `
                    <tr>
                        <td>رسوم جمركية</td>
                        <td>1</td>
                        <td>${invoice.customsFee.toFixed(2)} ${invoice.currency}</td>
                        <td>${invoice.customsFee.toFixed(2)} ${invoice.currency}</td>
                    </tr>
                    ` : ''}
                </tbody>
            </table>

            <div class="totals">
                <div class="total-row">
                    <span class="total-label">المجموع الفرعي:</span>
                    <span class="total-value">${invoice.subtotal.toFixed(2)} ${invoice.currency}</span>
                </div>
                ${invoice.customsFee > 0 ? `
                <div class="total-row">
                    <span class="total-label">الرسوم الجمركية:</span>
                    <span class="total-value">${invoice.customsFee.toFixed(2)} ${invoice.currency}</span>
                </div>
                ` : ''}
                <div class="total-row">
                    <span class="total-label">ضريبة القيمة المضافة (${(invoice.taxRate * 100).toFixed(0)}%):</span>
                    <span class="total-value">${invoice.taxAmount.toFixed(2)} ${invoice.currency}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">المجموع الإجمالي:</span>
                    <span class="total-value">${invoice.total.toFixed(2)} ${invoice.currency}</span>
                </div>
            </div>

            ${invoice.notes ? `
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 6px;">
                <div style="font-weight: 600; margin-bottom: 10px; color: #374151;">ملاحظات:</div>
                <div style="color: #6b7280;">${invoice.notes}</div>
            </div>
            ` : ''}

            <div class="footer">
                <p>شكراً لاختياركم خدماتنا • برو فليت للنقل والخدمات اللوجستية</p>
                <p>هذه فاتورة إلكترونية ولا تحتاج إلى توقيع</p>
            </div>
        </div>
    </body>
    </html>
    `

    // Generate actual PDF using puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })
    
    await browser.close()
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      }
    })

  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
