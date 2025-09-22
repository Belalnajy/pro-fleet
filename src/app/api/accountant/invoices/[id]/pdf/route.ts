import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";

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
      (error as Error).message?.includes("Protocol error") ||
      (error as Error).message?.includes("Target closed")
    ) {
      console.error(
        "Puppeteer browser error - likely Chrome/Chromium not available"
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

// Generate HTML content for PDF
function generateInvoiceHTML(invoice: any) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US");
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ${invoice.currency || "SAR"}`;
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .company { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .invoice-info { margin: 20px 0; }
            .customer-info { margin: 20px 0; }
            .trip-info { margin: 20px 0; background: #f5f5f5; padding: 10px; }
            .totals { margin: 20px 0; text-align: right; }
            .total-row { margin: 5px 0; }
            .final-total { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background: #f0f0f0; font-weight: bold; }

        </style>
    </head>
    <body>
        <div class="header">
            <div class="company">Pro Fleet Transport</div>
            <div>Transportation & Logistics Services</div>
            <div>Saudi Arabia | Phone: +966 11 123 4567 | Email: info@profleet.com</div>
        </div>
        
        <div class="invoice-info">
            <h2>Invoice #${invoice.invoiceNumber}</h2>
            <p><strong>Issue Date:</strong> ${new Date(
              invoice.createdAt
            ).toLocaleDateString("en-US")}</p>
            <p><strong>Due Date:</strong> ${new Date(
              invoice.dueDate
            ).toLocaleDateString("en-US")}</p>
            <p><strong>Status:</strong> ${
              invoice.paymentStatus === "PENDING"
                ? "Pending"
                : invoice.paymentStatus === "PAID"
                ? "Paid"
                : invoice.paymentStatus === "OVERDUE"
                ? "Overdue"
                : "Cancelled"
            }</p>
        </div>

        <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>${
              invoice.trip?.customer?.name || "Customer Not Specified"
            }</strong></p>
            <p>${invoice.trip?.customer?.email || ""}</p>
            <p>${invoice.trip?.customer?.phone || ""}</p>
        </div>

        ${
          invoice.trip
            ? `
        <div class="trip-info">
            <h3>Trip Details</h3>
            <p><strong>Trip Number:</strong> ${invoice.trip.tripNumber}</p>
            <p><strong>Route:</strong> ${invoice.trip.fromCity?.name} → ${
                invoice.trip.toCity?.name
              }</p>
            <p><strong>Driver:</strong> ${
              invoice.trip.driver?.user?.name || "Not Specified"
            }</p>
            <p><strong>Vehicle:</strong> ${
              invoice.trip.vehicle?.vehicleType?.nameAr || "Not Specified"
            }</p>
        </div>
        `
            : ""
        }

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Transportation Service${
                      invoice.trip ? ` - ${invoice.trip.tripNumber}` : ""
                    }</td>
                    <td>1</td>
                    <td>${invoice.subtotal.toFixed(2)} ${invoice.currency}</td>
                    <td>${invoice.subtotal.toFixed(2)} ${invoice.currency}</td>
                </tr>
                ${
                  invoice.customsFee > 0
                    ? `
                <tr>
                    <td>Customs Fee</td>
                    <td>1</td>
                    <td>${invoice.customsFee.toFixed(2)} ${
                        invoice.currency
                      }</td>
                    <td>${invoice.customsFee.toFixed(2)} ${
                        invoice.currency
                      }</td>
                </tr>
                `
                    : ""
                }
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <strong>Subtotal: ${invoice.subtotal.toFixed(2)} ${
    invoice.currency
  }</strong>
            </div>
            ${
              invoice.customsFee > 0
                ? `
            <div class="total-row">
                <strong>Customs Fee: ${invoice.customsFee.toFixed(2)} ${
                    invoice.currency
                  }</strong>
            </div>
            `
                : ""
            }
            <div class="total-row">
                <strong>VAT (${(invoice.taxRate * 100).toFixed(
                  0
                )}%): ${invoice.taxAmount.toFixed(2)} ${
    invoice.currency
  }</strong>
            </div>
            <div class="final-total">
                <strong>Total Amount: ${invoice.total.toFixed(2)} ${
    invoice.currency
  }</strong>
            </div>
        </div>

        ${
          invoice.notes
            ? `
        <div style="margin-top: 30px; padding: 15px; background: #f5f5f5;">
            <strong>Notes:</strong><br>
            ${invoice.notes}
        </div>
        `
            : ""
        }

        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
            <p>Thank you for choosing Pro Fleet Transportation Services</p>
            <p>This is an electronic invoice and does not require a signature</p>
        </div>
    </body>
    </html>
    `;
}
