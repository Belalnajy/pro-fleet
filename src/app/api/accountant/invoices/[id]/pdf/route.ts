import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: invoiceId } = await params;

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
            },
            vehicle: {
              include: {
                vehicleType: { select: { name: true, nameAr: true } }
              }
            }
          }
        },
        customsBroker: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Generate HTML content for PDF
    const htmlContent = generateInvoiceHTML(invoice);

    // Generate actual PDF using puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // <- this one doesn't work in Windows
        "--disable-gpu"
      ],
      executablePath:
        process.env.NODE_ENV === "production"
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
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`
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
      error.message?.includes("Protocol error") ||
      error.message?.includes("Target closed")
    ) {
      console.error(
        "Puppeteer browser error - likely Chrome/Chromium not available"
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Generate HTML content for PDF
function generateInvoiceHTML(invoice: any): string {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 2
    }).format(amount);
  };

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoice.invoiceNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background: #fff;
                direction: rtl;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
            }
            .company-name {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .invoice-title {
                font-size: 24px;
                color: #374151;
                margin-bottom: 10px;
            }
            .invoice-number {
                font-size: 18px;
                color: #6b7280;
            }
            .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                gap: 40px;
            }
            .info-block {
                flex: 1;
            }
            .info-title {
                font-weight: bold;
                color: #374151;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .info-content {
                color: #6b7280;
                font-size: 14px;
                line-height: 1.5;
            }
            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                border: 1px solid #e5e7eb;
            }
            .details-table th,
            .details-table td {
                padding: 12px;
                text-align: right;
                border-bottom: 1px solid #e5e7eb;
            }
            .details-table th {
                background-color: #f9fafb;
                font-weight: bold;
                color: #374151;
            }
            .amount-section {
                margin-top: 30px;
                border-top: 2px solid #e5e7eb;
                padding-top: 20px;
            }
            .amount-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }
            .amount-row.total {
                font-size: 18px;
                font-weight: bold;
                color: #059669;
                border-top: 1px solid #e5e7eb;
                padding-top: 10px;
                margin-top: 15px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            .status-sent { background: #dbeafe; color: #1e40af; }
            .footer {
                margin-top: 40px;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="company-name">برو فليت للنقل والخدمات اللوجستية</div>
                <div class="invoice-title">فاتورة</div>
                <div class="invoice-number">${invoice.invoiceNumber}</div>
            </div>

            <div class="info-section">
                <div class="info-block">
                    <div class="info-title">معلومات العميل:</div>
                    <div class="info-content">
                        <strong>${
                          invoice.trip?.customer?.name || "غير محدد"
                        }</strong><br>
                        ${invoice.trip?.customer?.email || ""}<br>
                        ${invoice.trip?.customer?.phone || ""}
                    </div>
                </div>
                <div class="info-block">
                    <div class="info-title">تفاصيل الفاتورة:</div>
                    <div class="info-content">
                        <strong>تاريخ الإصدار:</strong> ${formatDate(
                          invoice.createdAt
                        )}<br>
                        <strong>تاريخ الاستحقاق:</strong> ${formatDate(
                          invoice.dueDate
                        )}<br>
                        <strong>الحالة:</strong> 
                        <span class="status-badge status-${invoice.paymentStatus.toLowerCase()}">
                            ${
                              invoice.paymentStatus === "PENDING"
                                ? "في الانتظار"
                                : invoice.paymentStatus === "PAID"
                                ? "مدفوعة"
                                : invoice.paymentStatus === "OVERDUE"
                                ? "متأخرة"
                                : invoice.paymentStatus === "SENT"
                                ? "تم الإرسال"
                                : invoice.paymentStatus
                            }
                        </span>
                    </div>
                </div>
            </div>

            ${
              invoice.trip
                ? `
            <table class="details-table">
                <thead>
                    <tr>
                        <th>الوصف</th>
                        <th>التفاصيل</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>رقم الرحلة</strong></td>
                        <td>${invoice.trip.tripNumber}</td>
                    </tr>
                    <tr>
                        <td><strong>المسار</strong></td>
                        <td>${
                          invoice.trip.fromCity?.nameAr ||
                          invoice.trip.fromCity?.name ||
                          "غير محدد"
                        } → ${
                    invoice.trip.toCity?.nameAr ||
                    invoice.trip.toCity?.name ||
                    "غير محدد"
                  }</td>
                    </tr>
                    ${
                      invoice.trip.driver
                        ? `
                    <tr>
                        <td><strong>السائق</strong></td>
                        <td>${invoice.trip.driver.user?.name || "غير محدد"}</td>
                    </tr>
                    `
                        : ""
                    }
                    ${
                      invoice.trip.vehicle
                        ? `
                    <tr>
                        <td><strong>المركبة</strong></td>
                        <td>${
                          invoice.trip.vehicle.vehicleType?.nameAr ||
                          invoice.trip.vehicle.vehicleType?.name ||
                          "غير محدد"
                        }</td>
                    </tr>
                    `
                        : ""
                    }
                </tbody>
            </table>
            `
                : ""
            }

            <div class="amount-section">
                <div class="amount-row">
                    <span>المبلغ الفرعي:</span>
                    <span>${formatCurrency(invoice.subtotal)}</span>
                </div>
                <div class="amount-row">
                    <span>الضريبة (15%):</span>
                    <span>${formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div class="amount-row">
                    <span>رسوم الجمارك:</span>
                    <span>${formatCurrency(invoice.customsFees)}</span>
                </div>
                <div class="amount-row total">
                    <span>المبلغ الإجمالي:</span>
                    <span>${formatCurrency(invoice.total)}</span>
                </div>
            </div>

            ${
              invoice.notes
                ? `
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 6px;">
                <div style="font-weight: 600; margin-bottom: 10px; color: #374151;">ملاحظات:</div>
                <div style="color: #6b7280;">${invoice.notes}</div>
            </div>
            `
                : ""
            }

            <div class="footer">
                <p>شكراً لاختياركم خدماتنا • برو فليت للنقل والخدمات اللوجستية</p>
                <p>هذه فاتورة إلكترونية ولا تحتاج إلى توقيع</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
