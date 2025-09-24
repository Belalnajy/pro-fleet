import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { generateInvoiceNumber, generateClearanceInvoiceNumber } from "@/lib/invoice-number-generator"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    // Only admin can run migration
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "غير مصرح - الأدمن فقط" }, { status: 403 })
    }

    const results = {
      regularInvoices: { success: 0, error: 0, details: [] as any[] },
      clearanceInvoices: { success: 0, error: 0, details: [] as any[] }
    }

    // 1. Migrate regular invoices (INV- format to PRO-INV- format)
    const regularInvoicesToUpdate = await db.invoice.findMany({
      where: {
        invoiceNumber: { startsWith: "INV-" }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        invoiceNumber: true,
        createdAt: true
      }
    })

    // Group regular invoices by date
    const regularInvoicesByDate = new Map<string, typeof regularInvoicesToUpdate>()
    
    for (const invoice of regularInvoicesToUpdate) {
      const dateKey = invoice.createdAt.toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD
      if (!regularInvoicesByDate.has(dateKey)) {
        regularInvoicesByDate.set(dateKey, [])
      }
      regularInvoicesByDate.get(dateKey)!.push(invoice)
    }

    // Process regular invoices
    for (const [dateKey, invoices] of regularInvoicesByDate.entries()) {
      let sequentialNumber = 1

      for (const invoice of invoices) {
        try {
          const year = dateKey.substring(0, 4)
          const month = dateKey.substring(4, 6)
          const day = dateKey.substring(6, 8)
          const sequence = String(sequentialNumber).padStart(3, '0')
          
          const newInvoiceNumber = `PRO-INV-${year}${month}${day}${sequence}`

          // Check if new number already exists
          const existingInvoice = await db.invoice.findFirst({
            where: { invoiceNumber: newInvoiceNumber }
          })

          if (!existingInvoice) {
            await db.invoice.update({
              where: { id: invoice.id },
              data: { invoiceNumber: newInvoiceNumber }
            })

            results.regularInvoices.details.push({
              oldNumber: invoice.invoiceNumber,
              newNumber: newInvoiceNumber,
              status: 'success'
            })
            results.regularInvoices.success++
          } else {
            // Try with incremented number
            sequentialNumber++
            const alternativeSequence = String(sequentialNumber).padStart(3, '0')
            const alternativeNumber = `PRO-INV-${year}${month}${day}${alternativeSequence}`
            
            const alternativeExists = await db.invoice.findFirst({
              where: { invoiceNumber: alternativeNumber }
            })

            if (!alternativeExists) {
              await db.invoice.update({
                where: { id: invoice.id },
                data: { invoiceNumber: alternativeNumber }
              })

              results.regularInvoices.details.push({
                oldNumber: invoice.invoiceNumber,
                newNumber: alternativeNumber,
                status: 'success'
              })
              results.regularInvoices.success++
            } else {
              results.regularInvoices.details.push({
                oldNumber: invoice.invoiceNumber,
                newNumber: 'conflict',
                status: 'error',
                error: 'رقم الفاتورة الجديد موجود بالفعل'
              })
              results.regularInvoices.error++
            }
          }

          sequentialNumber++
        } catch (error) {
          console.error(`Error updating regular invoice ${invoice.id}:`, error)
          results.regularInvoices.details.push({
            oldNumber: invoice.invoiceNumber,
            newNumber: 'error',
            status: 'error',
            error: error instanceof Error ? error.message : 'خطأ غير معروف'
          })
          results.regularInvoices.error++
        }
      }
    }

    // 2. Migrate clearance invoices (CI- format to PRO-CLR- format)
    const clearanceInvoicesToUpdate = await db.customsClearanceInvoice.findMany({
      where: {
        invoiceNumber: { startsWith: "CI-" }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        invoiceNumber: true,
        createdAt: true
      }
    })

    // Group clearance invoices by date
    const clearanceInvoicesByDate = new Map<string, typeof clearanceInvoicesToUpdate>()
    
    for (const invoice of clearanceInvoicesToUpdate) {
      const dateKey = invoice.createdAt.toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD
      if (!clearanceInvoicesByDate.has(dateKey)) {
        clearanceInvoicesByDate.set(dateKey, [])
      }
      clearanceInvoicesByDate.get(dateKey)!.push(invoice)
    }

    // Process clearance invoices
    for (const [dateKey, invoices] of clearanceInvoicesByDate.entries()) {
      let sequentialNumber = 1

      for (const invoice of invoices) {
        try {
          const year = dateKey.substring(0, 4)
          const month = dateKey.substring(4, 6)
          const day = dateKey.substring(6, 8)
          const sequence = String(sequentialNumber).padStart(3, '0')
          
          const newInvoiceNumber = `PRO-CLR-${year}${month}${day}${sequence}`

          // Check if new number already exists
          const existingInvoice = await db.customsClearanceInvoice.findFirst({
            where: { invoiceNumber: newInvoiceNumber }
          })

          if (!existingInvoice) {
            await db.customsClearanceInvoice.update({
              where: { id: invoice.id },
              data: { invoiceNumber: newInvoiceNumber }
            })

            results.clearanceInvoices.details.push({
              oldNumber: invoice.invoiceNumber,
              newNumber: newInvoiceNumber,
              status: 'success'
            })
            results.clearanceInvoices.success++
          } else {
            // Try with incremented number
            sequentialNumber++
            const alternativeSequence = String(sequentialNumber).padStart(3, '0')
            const alternativeNumber = `PRO-CLR-${year}${month}${day}${alternativeSequence}`
            
            const alternativeExists = await db.customsClearanceInvoice.findFirst({
              where: { invoiceNumber: alternativeNumber }
            })

            if (!alternativeExists) {
              await db.customsClearanceInvoice.update({
                where: { id: invoice.id },
                data: { invoiceNumber: alternativeNumber }
              })

              results.clearanceInvoices.details.push({
                oldNumber: invoice.invoiceNumber,
                newNumber: alternativeNumber,
                status: 'success'
              })
              results.clearanceInvoices.success++
            } else {
              results.clearanceInvoices.details.push({
                oldNumber: invoice.invoiceNumber,
                newNumber: 'conflict',
                status: 'error',
                error: 'رقم فاتورة التخليص الجديد موجود بالفعل'
              })
              results.clearanceInvoices.error++
            }
          }

          sequentialNumber++
        } catch (error) {
          console.error(`Error updating clearance invoice ${invoice.id}:`, error)
          results.clearanceInvoices.details.push({
            oldNumber: invoice.invoiceNumber,
            newNumber: 'error',
            status: 'error',
            error: error instanceof Error ? error.message : 'خطأ غير معروف'
          })
          results.clearanceInvoices.error++
        }
      }
    }

    const totalSuccess = results.regularInvoices.success + results.clearanceInvoices.success
    const totalError = results.regularInvoices.error + results.clearanceInvoices.error

    return NextResponse.json({
      message: `تم تحديث ${totalSuccess} فاتورة بنجاح، ${totalError} خطأ`,
      regularInvoices: {
        success: results.regularInvoices.success,
        error: results.regularInvoices.error,
        details: results.regularInvoices.details.slice(0, 25) // Show first 25
      },
      clearanceInvoices: {
        success: results.clearanceInvoices.success,
        error: results.clearanceInvoices.error,
        details: results.clearanceInvoices.details.slice(0, 25) // Show first 25
      },
      totalSuccess,
      totalError
    })

  } catch (error) {
    console.error("Invoice migration error:", error)
    return NextResponse.json(
      { error: "خطأ في تحديث أرقام الفواتير" },
      { status: 500 }
    )
  }
}

// GET endpoint to check how many invoices need migration
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "غير مصرح - الأدمن فقط" }, { status: 403 })
    }

    // Count regular invoices with old format
    const oldRegularInvoicesCount = await db.invoice.count({
      where: { invoiceNumber: { startsWith: "INV-" } }
    })

    // Count regular invoices with new format
    const newRegularInvoicesCount = await db.invoice.count({
      where: { invoiceNumber: { startsWith: "PRO-INV-" } }
    })

    // Count clearance invoices with old format
    const oldClearanceInvoicesCount = await db.customsClearanceInvoice.count({
      where: { invoiceNumber: { startsWith: "CI-" } }
    })

    // Count clearance invoices with new format
    const newClearanceInvoicesCount = await db.customsClearanceInvoice.count({
      where: { invoiceNumber: { startsWith: "PRO-CLR-" } }
    })

    // Get samples
    const sampleOldRegularInvoices = await db.invoice.findMany({
      where: { invoiceNumber: { startsWith: "INV-" } },
      select: { invoiceNumber: true, createdAt: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    const sampleOldClearanceInvoices = await db.customsClearanceInvoice.findMany({
      where: { invoiceNumber: { startsWith: "CI-" } },
      select: { invoiceNumber: true, createdAt: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      regularInvoices: {
        oldFormatCount: oldRegularInvoicesCount,
        newFormatCount: newRegularInvoicesCount,
        needsMigration: oldRegularInvoicesCount > 0,
        samples: sampleOldRegularInvoices
      },
      clearanceInvoices: {
        oldFormatCount: oldClearanceInvoicesCount,
        newFormatCount: newClearanceInvoicesCount,
        needsMigration: oldClearanceInvoicesCount > 0,
        samples: sampleOldClearanceInvoices
      },
      totalOldInvoices: oldRegularInvoicesCount + oldClearanceInvoicesCount,
      totalNewInvoices: newRegularInvoicesCount + newClearanceInvoicesCount,
      needsMigration: (oldRegularInvoicesCount + oldClearanceInvoicesCount) > 0
    })

  } catch (error) {
    console.error("Invoice migration check error:", error)
    return NextResponse.json(
      { error: "خطأ في فحص أرقام الفواتير" },
      { status: 500 }
    )
  }
}
