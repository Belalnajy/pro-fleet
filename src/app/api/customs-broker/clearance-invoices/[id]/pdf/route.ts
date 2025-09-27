import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
import { getCompanyInfo } from "@/lib/system-settings";
import JsBarcode from "jsbarcode";
import { createCanvas } from "canvas";

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

// Helper function to generate barcode as base64
function generateBarcodeBase64(text: string): string {
  try {
    const canvas = createCanvas(200, 50);
    JsBarcode(canvas, text, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      textMargin: 2,
      margin: 10
    });
    return canvas.toDataURL();
  } catch (error) {
    console.error("Error generating barcode:", error);
    // Fallback: return a simple text representation
    return `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="50" fill="white" stroke="#000" stroke-width="1"/>
        <text x="100" y="30" font-family="Arial" font-size="12" text-anchor="middle" fill="black">${text}</text>
      </svg>
    `).toString("base64")}`;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clearanceInvoice = await db.customsClearanceInvoice.findUnique({
      where: { id: params.id },
      include: {
        clearance: {
          include: {
            customsBroker: {
              include: {
                user: true
              }
            },
            invoice: {
              include: {
                trip: {
                  include: {
                    fromCity: true,
                    toCity: true,
                    customer: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!clearanceInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if this customs broker owns this invoice
    if (clearanceInvoice.clearance.customsBroker.user.id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get company info from system settings
    const companyInfo = await getCompanyInfo();

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
            .invoice-header-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            .barcode-container {
                text-align: center;
            }
            .barcode-image {
                max-width: 200px;
                height: auto;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                padding: 5px;
                background: white;
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
            .section-title { 
                font-weight: bold; 
                font-size: 16px; 
                margin-bottom: 10px; 
                color: #333;
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
                color: #000;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .total-row.final {
                border-top: 2px solid #333;
                border-bottom: none;
                font-weight: bold;
                font-size: 16px;
                margin-top: 15px;
                padding-top: 15px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <img src="${getLogoBase64()}" alt="شعار الشركة" style="width: 100px; height: 100px; margin-bottom: 10px;">
            <div class="company">منصة Pro fleet</div>
            <div>خدمات النقل واللوجستيات</div>
            <div>المملكة العربية السعودية | هاتف: ${
              companyInfo.phone
            } | البريد: ${companyInfo.email}</div>
        </div>
        
        <div class="invoice-info">
            <div class="invoice-header-container">
                <div>
                    <div class="section-title">معلومات فاتورة التخليص الجمركي</div>
                    <div class="info-row">
                        <span class="label">رقم الفاتورة:</span>
                        <span class="value">${clearanceInvoice.invoiceNumber}</span>
                    </div>
                </div>
                <div class="barcode-container">
                    <img src="${generateBarcodeBase64(clearanceInvoice.invoiceNumber)}" alt="باركود الفاتورة" class="barcode-image">
                </div>
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
                <span class="value">${
                  clearanceInvoice.paymentStatus === "PENDING"
                    ? "معلقة"
                    : clearanceInvoice.paymentStatus === "PAID"
                    ? "مدفوعة"
                    : clearanceInvoice.paymentStatus === "PARTIAL"
                    ? "دفع جزئي"
                    : clearanceInvoice.paymentStatus === "INSTALLMENT"
                    ? "أقساط"
                    : clearanceInvoice.paymentStatus === "OVERDUE"
                    ? "متأخرة"
                    : "ملغية"
                }</span>
            </div>
        </div>

        ${
          clearanceInvoice.clearance.invoice?.trip?.customer
            ? `
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
        `
            : ""
        }

        <div class="clearance-info">
            <div class="section-title">تفاصيل التخليص الجمركي</div>
            <div class="info-row">
                <span class="label">نوع البضاعة:</span>
                <span class="value">${clearanceInvoice.clearance.goodsType}</span>
            </div>
            <div class="info-row">
                <span class="label">القيمة المعلنة:</span>
                <span class="value">${clearanceInvoice.clearance.declaredValue.toLocaleString(
                  "ar-SA"
                )} ريال</span>
            </div>
            <div class="info-row">
                <span class="label">الوزن:</span>
                <span class="value">${clearanceInvoice.clearance.weight} كيلو</span>
            </div>
            <div class="info-row">
                <span class="label">حالة التخليص:</span>
                <span class="value">${
                  clearanceInvoice.clearance.status === "PENDING"
                    ? "في الانتظار"
                    : clearanceInvoice.clearance.status === "IN_PROGRESS"
                    ? "قيد التنفيذ"
                    : clearanceInvoice.clearance.status === "COMPLETED"
                    ? "مكتمل"
                    : clearanceInvoice.clearance.status === "CANCELLED"
                    ? "ملغي"
                    : "غير محدد"
                }</span>
            </div>
            ${
              clearanceInvoice.clearance.estimatedCompletionDate
                ? `
            <div class="info-row">
                <span class="label">تاريخ الإنجاز المتوقع:</span>
                <span class="value">${new Date(
                  clearanceInvoice.clearance.estimatedCompletionDate
                ).toLocaleDateString("ar-SA")}</span>
            </div>
            `
                : ""
            }
        </div>

        ${
          clearanceInvoice.clearance.invoice?.trip
            ? `
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
                <span class="value">${
                  clearanceInvoice.clearance.invoice.trip.fromCity?.name
                } ← ${
              clearanceInvoice.clearance.invoice.trip.toCity?.name
            }</span>
            </div>
            <div class="info-row">
                <span class="label">تاريخ الرحلة:</span>
                <span class="value">${new Date(
                  clearanceInvoice.clearance.invoice.trip.scheduledDate
                ).toLocaleDateString("ar-SA")}</span>
            </div>
        </div>
        `
            : ""
        }

        <div class="totals">
            <div class="section-title">تفاصيل المبالغ</div>
            <div class="total-row">
                <span>المجموع الفرعي:</span>
                <span>${clearanceInvoice.subtotal.toLocaleString(
                  "ar-SA"
                )} ريال</span>
            </div>
            <div class="total-row">
                <span>ضريبة القيمة المضافة (${(
                  clearanceInvoice.taxRate * 100
                ).toFixed(0)}%):</span>
                <span>${clearanceInvoice.taxAmount.toLocaleString(
                  "ar-SA"
                )} ريال</span>
            </div>
            <div class="total-row final">
                <span>المبلغ الإجمالي:</span>
                <span>${clearanceInvoice.total.toLocaleString(
                  "ar-SA"
                )} ريال</span>
            </div>
            
            <div class="total-row">
                <span>المبلغ المدفوع:</span>
                <span>${(clearanceInvoice.amountPaid || 0).toLocaleString(
                  "ar-SA"
                )} ريال</span>
            </div>
            <div class="total-row">
                <span>المبلغ المتبقي:</span>
                <span>${(
                  clearanceInvoice.remainingAmount || clearanceInvoice.total
                ).toLocaleString("ar-SA")} ريال</span>
            </div>

            ${
              clearanceInvoice.paymentStatus === "INSTALLMENT" &&
              clearanceInvoice.installmentCount
                ? `
            <div class="total-row">
                <span>عدد الأقساط:</span>
                <span>${clearanceInvoice.installmentCount} قسط</span>
            </div>
            <div class="total-row">
                <span>الأقساط المدفوعة:</span>
                <span>${
                  clearanceInvoice.installmentsPaid || 0
                } من ${clearanceInvoice.installmentCount}</span>
            </div>
            <div class="total-row">
                <span>قيمة القسط:</span>
                <span>${(
                  clearanceInvoice.installmentAmount || 0
                ).toLocaleString("ar-SA")} ريال</span>
            </div>
            ${
              clearanceInvoice.nextInstallmentDate
                ? `
            <div class="total-row">
                <span>تاريخ القسط التالي:</span>
                <span>${new Date(
                  clearanceInvoice.nextInstallmentDate
                ).toLocaleDateString("ar-SA")}</span>
            </div>
            `
                : ""
            }
            `
                : ""
            }
        </div>

        ${
          clearanceInvoice.notes
            ? `
        <div style="margin: 20px 0; background: #fffbeb; padding: 15px; border-radius: 5px; border: 1px solid #f59e0b;">
            <div class="section-title" style="color: #92400e;">ملاحظات:</div>
            <div>${clearanceInvoice.notes}</div>
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
