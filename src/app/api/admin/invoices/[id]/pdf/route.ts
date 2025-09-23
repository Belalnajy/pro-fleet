import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import puppeteer from "puppeteer"
import chromium from "@sparticuz/chromium"
import fs from "fs"
import path from "path"
import { getCompanyInfo } from "@/lib/system-settings";

// Helper function to get logo as base64
function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "Website-Logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }
  } catch (error) {
    console.log("Logo not found, using placeholder");
  }
  // Fallback: simple SVG logo
  return (
    "data:image/svg+xml;base64," +
    Buffer.from(
      `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#3b82f6" rx="10"/>
      <text x="50" y="35" font-family="Arial" font-size="12" fill="white" text-anchor="middle">PRO</text>
      <text x="50" y="55" font-family="Arial" font-size="12" fill="white" text-anchor="middle">FLEET</text>
      <text x="50" y="75" font-family="Arial" font-size="8" fill="white" text-anchor="middle">LOGISTICS</text>
    </svg>
  `
    ).toString("base64")
  );
}

// GET /api/admin/invoices/[id]/pdf - Generate PDF for invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    // Get company info from system settings
    const companyInfo = await getCompanyInfo();

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id },
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
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Generate Arabic HTML content for PDF with professional design
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>فاتورة ${invoice.invoiceNumber}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Noto Sans Arabic', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background: #fff;
                direction: rtl;
                text-align: right;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                color: black;
                padding: 30px;
                border-radius: 15px 15px 0 0;
                text-align: center;
                margin-bottom: 0;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 15px;
                border-radius: 10px;
            }
            
            .company-name {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .company-tagline {
                font-size: 16px;
                opacity: 0.9;
                margin-bottom: 15px;
            }
            
            .company-contact {
                font-size: 14px;
                opacity: 0.8;
            }
            
            .invoice-header {
                background: #f8fafc;
                padding: 25px;
                border-left: 5px solid #3b82f6;
                margin-bottom: 25px;
            }
            
            .invoice-title {
                font-size: 24px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 15px;
            }
            
            .invoice-meta {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .meta-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .meta-label {
                font-weight: 600;
                color: #64748b;
            }
            
            .meta-value {
                font-weight: 600;
                color: #1e293b;
            }
            
            .status {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status.paid {
                background: #dcfce7;
                color: #166534;
            }
            
            .status.pending {
                background: #fef3c7;
                color: #92400e;
            }
            
            .status.overdue {
                background: #fee2e2;
                color: #991b1b;
            }
            
            .status.partial {
                background: #fef3c7;
                color: #d97706;
            }
            
            .status.installment {
                background: #e0e7ff;
                color: #3730a3;
            }
            
            .info-section {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .section-title {
                font-size: 18px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 2px solid #e2e8f0;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
            }
            
            .label {
                font-weight: 600;
                color: #64748b;
            }
            
            .value {
                font-weight: 600;
                color: #1e293b;
            }
            
            .services-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .services-table th {
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                color: white;
                padding: 15px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
            }
            
            .services-table td {
                padding: 15px;
                text-align: center;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .services-table tbody tr:hover {
                background: #f8fafc;
            }
            
            .totals-section {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 25px;
                margin-top: 20px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                font-size: 16px;
            }
            
            .total-row.subtotal {
                border-bottom: 1px solid #e2e8f0;
            }
            
            .total-row.final {
                border-top: 2px solid #3b82f6;
                margin-top: 15px;
                padding-top: 15px;
                font-size: 20px;
                font-weight: 700;
                color: #1e40af;
            }
            
            .notes-section {
                background: #fffbeb;
                border: 1px solid #f59e0b;
                border-radius: 10px;
                padding: 20px;
                margin-top: 20px;
            }
            
            .notes-title {
                font-weight: 700;
                color: #92400e;
                margin-bottom: 10px;
            }
            
            .footer {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                background: #f1f5f9;
                border-radius: 10px;
                color: #64748b;
                font-size: 14px;
            }
            
            @media print {
                .container {
                    max-width: none;
                    margin: 0;
                    padding: 0;
                }
                
                .header {
                    border-radius: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${getLogoBase64()}" alt="شعار الشركة" class="logo">
                <div class="company-name">برو فليت للنقل</div>
                <div class="company-tagline">خدمات النقل واللوجستيات</div>
                <div class="company-contact">المملكة العربية السعودية | هاتف: ${companyInfo.phone} | البريد: ${companyInfo.email}</div>
            </div>
            
            <div class="invoice-header">
                <div class="invoice-title">فاتورة رقم ${
                  invoice.invoiceNumber
                }</div>
                <div class="invoice-meta">
                    <div class="meta-item">
                        <span class="meta-label">تاريخ الإصدار:</span>
                        <span class="meta-value">${new Date(
                          invoice.createdAt
                        ).toLocaleDateString("ar-SA")}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">تاريخ الاستحقاق:</span>
                        <span class="meta-value">${new Date(
                          invoice.dueDate
                        ).toLocaleDateString("ar-SA")}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">حالة الدفع:</span>
                        <span class="meta-value">
                            <span class="status ${invoice.paymentStatus.toLowerCase()}">
                                ${
                                  invoice.paymentStatus === "PENDING"
                                    ? "معلقة"
                                    : invoice.paymentStatus === "PAID"
                                    ? "مدفوعة"
                                    : invoice.paymentStatus === "PARTIAL"
                                    ? "دفع جزئي"
                                    : invoice.paymentStatus === "INSTALLMENT"
                                    ? "أقساط"
                                    : invoice.paymentStatus === "OVERDUE"
                                    ? "متأخرة"
                                    : "ملغية"
                                }
                            </span>
                        </span>
                    </div>
                    ${
                      invoice.paidDate
                        ? `
                    <div class="meta-item">
                        <span class="meta-label">تاريخ الدفع:</span>
                        <span class="meta-value">${new Date(
                          invoice.paidDate
                        ).toLocaleDateString("ar-SA")}</span>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
            
            <!-- Payment Details Section -->
            <div class="info-section">
                <div class="section-title">معلومات الدفع</div>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="label">المبلغ الإجمالي:</span>
                        <span class="value">${invoice.total.toLocaleString(
                          "ar-SA"
                        )} ريال</span>
                    </div>
                    <div class="info-row">
                        <span class="label">المبلغ المدفوع:</span>
                        <span class="value">${(
                          invoice.amountPaid || 0
                        ).toLocaleString("ar-SA")} ريال</span>
                    </div>
                    <div class="info-row">
                        <span class="label">المبلغ المتبقي:</span>
                        <span class="value">${(
                          invoice.remainingAmount || invoice.total
                        ).toLocaleString("ar-SA")} ريال</span>
                    </div>
                    ${
                      invoice.paymentStatus === "INSTALLMENT" &&
                      invoice.installmentCount
                        ? `
                    <div class="info-row">
                        <span class="label">عدد الأقساط:</span>
                        <span class="value">${
                          invoice.installmentCount
                        } قسط</span>
                    </div>
                    <div class="info-row">
                        <span class="label">الأقساط المدفوعة:</span>
                        <span class="value">${
                          invoice.installmentsPaid || 0
                        } من ${invoice.installmentCount}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">قيمة القسط:</span>
                        <span class="value">${(
                          invoice.installmentAmount || 0
                        ).toLocaleString("ar-SA")} ريال</span>
                    </div>
                    ${
                      invoice.nextInstallmentDate
                        ? `
                    <div class="info-row">
                        <span class="label">تاريخ القسط التالي:</span>
                        <span class="value">${new Date(
                          invoice.nextInstallmentDate
                        ).toLocaleDateString("ar-SA")}</span>
                    </div>
                    `
                        : ""
                    }
                    `
                        : ""
                    }
                </div>
            </div>
            
            <div class="info-section">
                <div class="section-title">معلومات العميل</div>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="label">اسم العميل:</span>
                        <span class="value">${
                          invoice.trip?.customer?.name || "غير محدد"
                        }</span>
                    </div>
                    <div class="info-row">
                        <span class="label">البريد الإلكتروني:</span>
                        <span class="value">${
                          invoice.trip?.customer?.email || "غير محدد"
                        }</span>
                    </div>
                    <div class="info-row">
                        <span class="label">رقم الهاتف:</span>
                        <span class="value">${
                          invoice.trip?.customer?.phone || "غير محدد"
                        }</span>
                    </div>
                </div>
            </div>
            
            ${
              invoice.trip
                ? `
            <div class="info-section">
                <div class="section-title">تفاصيل الرحلة</div>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="label">رقم الرحلة:</span>
                        <span class="value">${invoice.trip.tripNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">المسار:</span>
                        <span class="value">${invoice.trip.fromCity?.name} ← ${
                    invoice.trip.toCity?.name
                  }</span>
                    </div>
                    <div class="info-row">
                        <span class="label">السائق:</span>
                        <span class="value">${
                          invoice.trip.driver?.user?.name || "غير محدد"
                        }</span>
                    </div>
                    <div class="info-row">
                        <span class="label">نوع المركبة:</span>
                        <span class="value">${
                          invoice.trip.vehicle?.vehicleType?.name || "غير محدد"
                        }</span>
                    </div>
                </div>
            </div>
            `
                : ""
            }
            
            <table class="services-table">
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
                        <td>خدمة النقل${
                          invoice.trip ? ` - ${invoice.trip.tripNumber}` : ""
                        }</td>
                        <td>1</td>
                        <td>${invoice.subtotal.toFixed(2)} ${
      invoice.currency
    }</td>
                        <td>${invoice.subtotal.toFixed(2)} ${
      invoice.currency
    }</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="totals-section">
                <div class="total-row subtotal">
                    <span>المجموع الفرعي:</span>
                    <span>${invoice.subtotal.toFixed(2)} ${
      invoice.currency
    }</span>
                </div>
                <div class="total-row">
                    <span>ضريبة القيمة المضافة (${(
                      invoice.taxRate * 100
                    ).toFixed(0)}%):</span>
                    <span>${invoice.taxAmount.toFixed(2)} ${
      invoice.currency
    }</span>
                </div>
                <div class="total-row final">
                    <span>المبلغ الإجمالي:</span>
                    <span>${invoice.total.toFixed(2)} ${invoice.currency}</span>
                </div>
            </div>
            
            ${
              invoice.notes
                ? `
            <div class="notes-section">
                <div class="notes-title">ملاحظات:</div>
                <div>${invoice.notes}</div>
            </div>
            `
                : ""
            }
            
            <div class="footer">
                <p>شكراً لاختياركم خدمات برو فليت للنقل</p>
                <p>هذه فاتورة إلكترونية ولا تحتاج إلى توقيع</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Generate actual PDF using puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: process.env.VERCEL
        ? [...chromium.args, "--hide-scrollbars", "--disable-web-security"]
        : [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor"
          ],
      executablePath: process.env.VERCEL
        ? await chromium.executablePath()
        : process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH ||
          "/usr/bin/google-chrome-stable"
        : undefined
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px"
      }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      }
    });
  } catch (error) {
    console.error("Error generating PDF:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Check if it's a Puppeteer-specific error
    if (
      (error as Error).message?.includes("Protocol error") ||
      (error as Error).message?.includes("Target closed") ||
      (error as Error).message?.includes("No usable sandbox") ||
      (error as Error).message?.includes("Failed to launch")
    ) {
      console.error(
        "Puppeteer browser error - likely Chrome/Chromium not available or misconfigured"
      );
      console.error(
        "Make sure Chrome is installed and PUPPETEER_EXECUTABLE_PATH is set correctly"
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined
      },
      { status: 500 }
    );
  }
}
