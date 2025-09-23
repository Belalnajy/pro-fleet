import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Get payment history for an invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const payments = await prisma.payment.findMany({
      where: { invoiceId: id },
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            total: true
          }
        }
      }
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST - Add a new payment
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
    const { amount, paymentMethod, reference, notes } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      )
    }

    // Get current invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice is already fully paid
    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already fully paid' },
        { status: 400 }
      )
    }

    // Calculate current totals
    const currentAmountPaid = invoice.amountPaid || 0
    const currentRemainingAmount = invoice.total - currentAmountPaid
    
    // Check if remaining amount is 0 or less
    if (currentRemainingAmount <= 0) {
      return NextResponse.json(
        { error: 'Invoice is fully paid, no additional payments allowed' },
        { status: 400 }
      )
    }
    
    // Check if payment amount exceeds remaining balance
    if (amount > currentRemainingAmount) {
      return NextResponse.json(
        { error: 'Payment amount exceeds remaining balance' },
        { status: 400 }
      )
    }
    const newAmountPaid = currentAmountPaid + amount
    const remainingAmount = Math.max(0, invoice.total - newAmountPaid)

    // Calculate installment tracking if applicable
    let installmentsPaid = invoice.installmentsPaid || 0
    let nextInstallmentDate = invoice.nextInstallmentDate
    
    if (invoice.installmentCount && invoice.installmentAmount) {
      // Calculate how many installments have been paid based on amount
      installmentsPaid = Math.floor(newAmountPaid / invoice.installmentAmount)
      installmentsPaid = Math.min(installmentsPaid, invoice.installmentCount)
      
      // Calculate next installment date if not fully paid
      if (installmentsPaid < invoice.installmentCount && newAmountPaid < invoice.total) {
        const currentDate = new Date()
        currentDate.setMonth(currentDate.getMonth() + 1)
        nextInstallmentDate = currentDate
      } else {
        nextInstallmentDate = null
      }
    }

    // Determine new payment status
    let newPaymentStatus = invoice.paymentStatus
    if (newAmountPaid >= invoice.total) {
      newPaymentStatus = 'PAID'
    } else if (newAmountPaid > 0) {
      // Check if this is part of an installment plan
      if (invoice.installmentCount && invoice.installmentCount > 0) {
        newPaymentStatus = 'INSTALLMENT'
      } else {
        newPaymentStatus = 'PARTIAL'
      }
    }

    // Create the payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount,
        paymentMethod,
        reference,
        notes,
        createdBy: session.user.id
      }
    })

    // Update invoice with new payment totals
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        remainingAmount,
        paymentStatus: newPaymentStatus,
        paidDate: newAmountPaid >= invoice.total ? new Date() : invoice.paidDate,
        installmentsPaid,
        nextInstallmentDate
      },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
        trip: {
          include: {
            customer: true
          }
        }
      }
    })

    return NextResponse.json({ 
      payment,
      invoice: updatedInvoice,
      message: 'Payment added successfully'
    })
  } catch (error) {
    console.error('Error adding payment:', error)
    return NextResponse.json(
      { error: 'Failed to add payment' },
      { status: 500 }
    )
  }
}
