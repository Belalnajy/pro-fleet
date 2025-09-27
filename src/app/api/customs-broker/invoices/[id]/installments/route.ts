import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get installment plan for a customs clearance invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CUSTOMS_BROKER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.customsClearanceInvoice.findUnique({
      where: { id: params.id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({
      installmentCount: invoice.installmentCount || 0,
      installmentsPaid: invoice.installmentsPaid || 0,
      installmentAmount: invoice.installmentAmount || 0,
      nextInstallmentDate: invoice.nextInstallmentDate,
      remainingInstallments: (invoice.installmentCount || 0) - (invoice.installmentsPaid || 0)
    })

  } catch (error) {
    console.error('Error fetching installment plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create installment plan for a customs clearance invoice
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CUSTOMS_BROKER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { installmentCount, startDate } = await request.json()

    if (!installmentCount || installmentCount < 2 || installmentCount > 12) {
      return NextResponse.json({ 
        error: 'Installment count must be between 2 and 12' 
      }, { status: 400 })
    }

    const invoice = await prisma.customsClearanceInvoice.findUnique({
      where: { id: params.id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if invoice is already paid or cancelled
    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json({ 
        error: 'Cannot create installment plan for paid invoice' 
      }, { status: 400 })
    }

    if (invoice.paymentStatus === 'CANCELLED') {
      return NextResponse.json({ 
        error: 'Cannot create installment plan for cancelled invoice' 
      }, { status: 400 })
    }

    // Calculate installment amount
    const remainingAmount = invoice.remainingAmount || (invoice.total - (invoice.amountPaid || 0))
    const installmentAmount = Math.ceil(remainingAmount / installmentCount)

    // Calculate next installment date
    const nextInstallmentDate = startDate ? new Date(startDate) : new Date()
    if (!startDate) {
      nextInstallmentDate.setMonth(nextInstallmentDate.getMonth() + 1)
    }

    // Update invoice with installment plan
    const updatedInvoice = await prisma.customsClearanceInvoice.update({
      where: { id: params.id },
      data: {
        paymentStatus: 'INSTALLMENT',
        installmentCount,
        installmentsPaid: 0,
        installmentAmount,
        nextInstallmentDate,
        remainingAmount
      }
    })

    return NextResponse.json({
      message: 'Installment plan created successfully',
      invoice: updatedInvoice
    })

  } catch (error) {
    console.error('Error creating installment plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update installment plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CUSTOMS_BROKER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { installmentCount, nextInstallmentDate } = await request.json()

    const invoice = await prisma.customsClearanceInvoice.findUnique({
      where: { id: params.id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.paymentStatus !== 'INSTALLMENT') {
      return NextResponse.json({ 
        error: 'Invoice does not have an installment plan' 
      }, { status: 400 })
    }

    // Calculate new installment amount
    const remainingAmount = invoice.remainingAmount || (invoice.total - (invoice.amountPaid || 0))
    const remainingInstallments = installmentCount - (invoice.installmentsPaid || 0)
    const installmentAmount = remainingInstallments > 0 ? Math.ceil(remainingAmount / remainingInstallments) : 0

    const updatedInvoice = await prisma.customsClearanceInvoice.update({
      where: { id: params.id },
      data: {
        installmentCount,
        installmentAmount,
        nextInstallmentDate: nextInstallmentDate ? new Date(nextInstallmentDate) : invoice.nextInstallmentDate
      }
    })

    return NextResponse.json({
      message: 'Installment plan updated successfully',
      invoice: updatedInvoice
    })

  } catch (error) {
    console.error('Error updating installment plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove installment plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CUSTOMS_BROKER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.customsClearanceInvoice.findUnique({
      where: { id: params.id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.paymentStatus !== 'INSTALLMENT') {
      return NextResponse.json({ 
        error: 'Invoice does not have an installment plan' 
      }, { status: 400 })
    }

    // Check if any installments have been paid
    if ((invoice.installmentsPaid || 0) > 0) {
      return NextResponse.json({ 
        error: 'Cannot remove installment plan after payments have been made' 
      }, { status: 400 })
    }

    // Remove installment plan and set status based on payments
    const newStatus = (invoice.amountPaid || 0) > 0 ? 'PARTIAL' : 'PENDING'

    const updatedInvoice = await prisma.customsClearanceInvoice.update({
      where: { id: params.id },
      data: {
        paymentStatus: newStatus,
        installmentCount: 0,
        installmentsPaid: 0,
        installmentAmount: 0,
        nextInstallmentDate: null
      }
    })

    return NextResponse.json({
      message: 'Installment plan removed successfully',
      invoice: updatedInvoice
    })

  } catch (error) {
    console.error('Error removing installment plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
