import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { setupInstallmentPlan, calculatePaymentStatus, PaymentStatus } from '@/lib/payment-calculator'

// POST - Set up installment plan for an invoice
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { installmentCount, firstInstallmentDate } = body

    // Validate required fields
    if (!installmentCount || installmentCount < 2 || installmentCount > 12) {
      return NextResponse.json(
        { error: 'Installment count must be between 2 and 12' },
        { status: 400 }
      )
    }

    if (!firstInstallmentDate) {
      return NextResponse.json(
        { error: 'First installment date is required' },
        { status: 400 }
      )
    }

    // Get current invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice is already paid
    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot set installments for paid invoice' },
        { status: 400 }
      )
    }

    // حساب خطة الأقساط باستخدام الدالة المساعدة
    const remainingAmount = invoice.total - (invoice.amountPaid || 0)
    const installmentPlan = setupInstallmentPlan(
      remainingAmount,
      installmentCount,
      new Date(firstInstallmentDate)
    )

    // حساب حالة المدفوعات الجديدة
    const paymentCalculation = calculatePaymentStatus(
      {
        total: invoice.total,
        dueDate: invoice.dueDate,
        installmentCount,
        installmentAmount: installmentPlan.installmentAmount,
        currentAmountPaid: invoice.amountPaid || 0,
        currentPaymentStatus: invoice.paymentStatus as PaymentStatus
      },
      [] // لا توجد مدفوعات جديدة هنا
    )

    // تحديث الفاتورة بخطة الأقساط
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        paymentStatus: 'INSTALLMENT',
        installmentCount,
        installmentAmount: installmentPlan.installmentAmount,
        nextInstallmentDate: installmentPlan.nextInstallmentDate,
        remainingAmount
      },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true,
            vehicle: {
              include: {
                vehicleType: true
              }
            },
            driver: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      invoice: updatedInvoice,
      message: 'Installment plan set successfully',
      installmentDetails: {
        totalInstallments: installmentCount,
        installmentAmount: installmentPlan.installmentAmount,
        remainingAmount,
        nextDueDate: installmentPlan.nextInstallmentDate,
        installmentSchedule: installmentPlan.installmentSchedule
      }
    })
  } catch (error) {
    console.error('Error setting installment plan:', error)
    return NextResponse.json(
      { error: 'Failed to set installment plan' },
      { status: 500 }
    )
  }
}

// PUT - Update installment plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { nextInstallmentDate } = body

    if (!nextInstallmentDate) {
      return NextResponse.json(
        { error: 'Next installment date is required' },
        { status: 400 }
      )
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        nextInstallmentDate: new Date(nextInstallmentDate)
      }
    })

    return NextResponse.json({ 
      invoice: updatedInvoice,
      message: 'Next installment date updated successfully'
    })
  } catch (error) {
    console.error('Error updating installment plan:', error)
    return NextResponse.json(
      { error: 'Failed to update installment plan' },
      { status: 500 }
    )
  }
}
