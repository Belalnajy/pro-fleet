import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Get payment history for customs clearance invoice
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'ACCOUNTANT', 'CUSTOMS_BROKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payments = await prisma.clearancePayment.findMany({
      where: { invoiceId: params.id },
      orderBy: { paymentDate: 'desc' },
      include: { invoice: { select: { invoiceNumber: true, total: true } } }
    })

    return NextResponse.json({ payments })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST - Add new payment
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'ACCOUNTANT', 'CUSTOMS_BROKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, paymentMethod, reference, notes } = await request.json()
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount required' }, { status: 400 })
    }

    const invoice = await prisma.customsClearanceInvoice.findUnique({
      where: { id: params.id },
      include: { payments: true }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const newAmountPaid = (invoice.amountPaid || 0) + amount
    const remainingAmount = Math.max(0, invoice.total - newAmountPaid)
    
    let newPaymentStatus = invoice.paymentStatus
    if (newAmountPaid >= invoice.total) {
      newPaymentStatus = 'PAID'
    } else if (newAmountPaid > 0) {
      newPaymentStatus = invoice.installmentCount ? 'INSTALLMENT' : 'PARTIAL'
    }

    const payment = await prisma.clearancePayment.create({
      data: {
        invoiceId: params.id,
        amount,
        paymentMethod,
        reference,
        notes,
        createdBy: session.user.id
      }
    })

    const updatedInvoice = await prisma.customsClearanceInvoice.update({
      where: { id: params.id },
      data: {
        amountPaid: newAmountPaid,
        remainingAmount,
        paymentStatus: newPaymentStatus,
        paidDate: newAmountPaid >= invoice.total ? new Date() : invoice.paidDate,
        installmentsPaid: invoice.installmentCount ? 
          Math.min(invoice.installmentsPaid + 1, invoice.installmentCount) : 
          invoice.installmentsPaid
      }
    })

    return NextResponse.json({ payment, invoice: updatedInvoice, message: 'Payment added successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add payment' }, { status: 500 })
  }
}
