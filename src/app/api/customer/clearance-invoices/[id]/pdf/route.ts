import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoiceId = params.id;
    
    // Get company info from system settings
    const companyInfo = await getCompanyInfo();

    // Verify the clearance invoice belongs to the customer and get full details
    const clearanceInvoice = await db.customsClearanceInvoice.findFirst({
      where: {
        id: invoiceId,
        clearance: {
          invoice: {
            trip: {
              customerId: session.user.id
            }
          }
        }
      },
      include: {
        clearance: {
          include: {
            customsBroker: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            },
            invoice: {
              include: {
                trip: {
                  include: {
                    customer: {
                      select: {
                        name: true,
                        email: true,
                        phone: true
                      }
                    },
                    fromCity: {
                      select: {
                        name: true,
                        nameAr: true
                      }
                    },
                    toCity: {
                      select: {
                        name: true,
                        nameAr: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        customsBroker: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!clearanceInvoice) {
      return NextResponse.json(
        { error: "Clearance invoice not found" },
        { status: 404 }
      );
    }

    // Generate Arabic HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>فاتورة التخليص الجمركي ${clearanceInvoice.invoiceNumber}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
            body { 
                font-family: 'Noto Sans Arabic', Arial, sans-serif; 
                margin: 20px; 
                font-size: 14px; 
                direction: rtl;
                text-align: right;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #000; 
                padding-bottom: 10px; 
            }
            .company { 
                font-size: 20px; 
                font-weight: bold; 
                margin-bottom: 5px; 
            }
            .invoice-info { 
                margin: 20px 0; 
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
            }
            .customer-info { 
                margin: 20px 0; 
                background: #e3f2fd;
                padding: 15px;
                border-radius: 5px;
            }
            .clearance-info { 
                margin: 20px 0; 
                background: #f3e5f5;
                padding: 15px;
                border-radius: 5px;
            }
            .trip-info { 
                margin: 20px 0; 
                background: #e8f5e8;
                padding: 15px;
                border-radius: 5px;
            }
            .totals { 
                margin: 20px 0; 
                text-align: right; 
                background: #fff3e0;
                padding: 15px;
                border-radius: 5px;
            }
            .total-row { 
                margin: 8px 0; 
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .final-total { 
                font-weight: bold; 
                font-size: 18px; 
                border-top: 2px solid #000; 
                padding-top: 15px; 
                margin-top: 15px;
                background: #4caf50;
                color: white;
                padding: 15px;
                border-radius: 5px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0; 
                direction: rtl;
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: center; 
            }
            th { 
                background: #f5f5f5; 
                font-weight: bold; 
            }
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                padding: 5px 0;
            }
            .label {
                font-weight: bold;
                color: #555;
            }
            .value {
                color: #333;
            }
            .status {
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: bold;
            }
            .status-paid {
                background: #4caf50;
                color: white;
            }
            .status-pending {
                background: #ff9800;
                color: white;
            }
            .status-overdue {
                background: #f44336;
                color: white;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="${getLogoBase64()}" alt="شعار الشركة" style="width: 100px; height: 100px; margin-bottom: 10px;">
            <div class="company">شركة برو فليت للنقل</div>
            <div>خدمات النقل واللوجستيات</div>
            <div>المملكة العربية السعودية | هاتف: ${companyInfo.phone} | البريد: ${companyInfo.email}</div>
        </div>
        
        <div class="invoice-info">
            <div class="section-title">معلومات فاتورة التخليص الجمركي</div>
            <div class="info-row">
                <span class="label">رقم الفاتورة:</span>
                <span class="value">${clearanceInvoice.invoiceNumber}</span>
            </div>
            <div class="info-row">
                <span class="label">رقم التخليص:</span>
                <span class="value">${
                  clearanceInvoice.clearance.clearanceNumber
                }</span>
            </div>
            <div class="info-row">
                <span class="label">تاريخ الإصدار:</span>
                <span class="value">${new Date(
                  clearanceInvoice.createdAt
                ).toLocaleDateString("ar-SA")}</span>
            </div>
            <div class="info-row">
                <span class="label">تاريخ الاستحقاق:</span>
                <span class="value">${new Date(
                  clearanceInvoice.dueDate
                ).toLocaleDateString("ar-SA")}</span>
            </div>
            <div class="info-row">
                <span class="label">حالة الدفع:</span>
                <span class="value">
                    <span class="status ${
                      clearanceInvoice.paymentStatus === "PAID"
                        ? "status-paid"
                        : clearanceInvoice.paymentStatus === "OVERDUE"
                        ? "status-overdue"
                        : "status-pending"
                    }">
                        ${
                          clearanceInvoice.paymentStatus === "PAID"
                            ? "مدفوعة"
                            : clearanceInvoice.paymentStatus === "OVERDUE"
                            ? "متأخرة"
                            : clearanceInvoice.paymentStatus === "SENT"
                            ? "مرسلة"
                            : "في الانتظار"
                        }
                    </span>
                </span>
            </div>
            ${
              clearanceInvoice.paidDate
                ? `
            <div class="info-row">
                <span class="label">تاريخ الدفع:</span>
                <span class="value">${new Date(
                  clearanceInvoice.paidDate
                ).toLocaleDateString("ar-SA")}</span>
            </div>
            `
                : ""
            }
        </div>

        <div class="customer-info">
            <div class="section-title">معلومات العميل</div>
            <div class="info-row">
                <span class="label">اسم العميل:</span>
                <span class="value">${
                  clearanceInvoice.clearance.invoice.trip.customer.name
                }</span>
            </div>
            <div class="info-row">
                <span class="label">البريد الإلكتروني:</span>
                <span class="value">${
                  clearanceInvoice.clearance.invoice.trip.customer.email
                }</span>
            </div>
            ${
              clearanceInvoice.clearance.invoice.trip.customer.phone
                ? `
            <div class="info-row">
                <span class="label">رقم الهاتف:</span>
                <span class="value">${clearanceInvoice.clearance.invoice.trip.customer.phone}</span>
            </div>
            `
                : ""
            }
        </div>

        <div class="clearance-info">
            <div class="section-title">معلومات المخلص الجمركي</div>
            <div class="info-row">
                <span class="label">اسم المخلص:</span>
                <span class="value">${
                  clearanceInvoice.customsBroker.user.name
                }</span>
            </div>
            ${
              clearanceInvoice.customsBroker.licenseNumber
                ? `
            <div class="info-row">
                <span class="label">رقم الترخيص:</span>
                <span class="value">${clearanceInvoice.customsBroker.licenseNumber}</span>
            </div>
            `
                : ""
            }
            <div class="info-row">
                <span class="label">البريد الإلكتروني:</span>
                <span class="value">${
                  clearanceInvoice.customsBroker.user.email
                }</span>
            </div>
            ${
              clearanceInvoice.customsBroker.user.phone
                ? `
            <div class="info-row">
                <span class="label">رقم الهاتف:</span>
                <span class="value">${clearanceInvoice.customsBroker.user.phone}</span>
            </div>
            `
                : ""
            }
            <div class="info-row">
                <span class="label">حالة التخليص:</span>
                <span class="value">${clearanceInvoice.clearance.status}</span>
            </div>
            ${
              clearanceInvoice.clearance.actualCompletionDate
                ? `
            <div class="info-row">
                <span class="label">تاريخ التخليص:</span>
                <span class="value">${new Date(
                  clearanceInvoice.clearance.actualCompletionDate
                ).toLocaleDateString("ar-SA")}</span>
            </div>
            `
                : ""
            }
        </div>

        <div class="trip-info">
            <div class="section-title">معلومات الرحلة</div>
            <div class="info-row">
                <span class="label">رقم الرحلة:</span>
                <span class="value">${
                  clearanceInvoice.clearance.invoice.trip.tripNumber
                }</span>
            </div>
            <div class="info-row">
                <span class="label">المسار:</span>
                <span class="value">
                    ${
                      clearanceInvoice.clearance.invoice.trip.fromCity.nameAr ||
                      clearanceInvoice.clearance.invoice.trip.fromCity.name
                    } 
                    ← 
                    ${
                      clearanceInvoice.clearance.invoice.trip.toCity.nameAr ||
                      clearanceInvoice.clearance.invoice.trip.toCity.name
                    }
                </span>
            </div>
            <div class="info-row">
                <span class="label">تاريخ الجدولة:</span>
                <span class="value">${new Date(
                  clearanceInvoice.clearance.invoice.trip.scheduledDate
                ).toLocaleDateString("ar-SA")}</span>
            </div>
            ${
              clearanceInvoice.clearance.invoice.trip.deliveredDate
                ? `
            <div class="info-row">
                <span class="label">تاريخ التسليم:</span>
                <span class="value">${new Date(
                  clearanceInvoice.clearance.invoice.trip.deliveredDate
                ).toLocaleDateString("ar-SA")}</span>
            </div>
            `
                : ""
            }
        </div>

        <table>
            <thead>
                <tr>
                    <th>البيان</th>
                    <th>المبلغ</th>
                    <th>العملة</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>رسوم التخليص الجمركي</td>
                    <td>${clearanceInvoice.customsFee.toFixed(2)}</td>
                    <td>${clearanceInvoice.currency}</td>
                </tr>
                ${
                  clearanceInvoice.additionalFees > 0
                    ? `
                <tr>
                    <td>رسوم إضافية</td>
                    <td>${clearanceInvoice.additionalFees.toFixed(2)}</td>
                    <td>${clearanceInvoice.currency}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                    <td>المجموع الفرعي</td>
                    <td>${clearanceInvoice.subtotal.toFixed(2)}</td>
                    <td>${clearanceInvoice.currency}</td>
                </tr>
                <tr>
                    <td>ضريبة القيمة المضافة (${(
                      clearanceInvoice.taxRate * 100
                    ).toFixed(0)}%)</td>
                    <td>${clearanceInvoice.taxAmount.toFixed(2)}</td>
                    <td>${clearanceInvoice.currency}</td>
                </tr>
            </tbody>
        </table>

        <div class="totals">
            <div class="final-total">
                <div class="total-row">
                    <span>المجموع الكلي:</span>
                    <span>${clearanceInvoice.total.toFixed(2)} ${
      clearanceInvoice.currency
    }</span>
                </div>
            </div>
        </div>

        ${
          clearanceInvoice.notes
            ? `
        <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
            <div class="section-title">ملاحظات</div>
            <p style="line-height: 1.6; margin: 10px 0;">${clearanceInvoice.notes}</p>
        </div>
        `
            : ""
        }

        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
            <p>شكراً لاختياركم خدمات شركة برو فليت للنقل</p>
            <p>هذه فاتورة إلكترونية ولا تحتاج إلى توقيع</p>
            <p>تم إنشاء هذه الفاتورة في: ${new Date().toLocaleDateString(
              "ar-SA"
            )} ${new Date().toLocaleTimeString("ar-SA")}</p>
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
        "Content-Disposition": `attachment; filename="clearance-invoice-${clearanceInvoice.invoiceNumber}.pdf"`
      }
    });
  } catch (error) {
    console.error("Error generating clearance invoice PDF:", error);

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
