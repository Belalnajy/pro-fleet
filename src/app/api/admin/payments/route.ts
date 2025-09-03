import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, we'll generate mock payment data based on completed trips
    // In a real application, you'd have a proper payments table
    const completedTrips = await db.trip.findMany({
      where: {
        status: "DELIVERED"
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        deliveredDate: "desc"
      }
    })

    // Transform trips into payment format
    const payments = completedTrips.map((trip, index) => {
      const paymentMethods = ['CASH', 'CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CHECK']
      const statuses = ['COMPLETED', 'PENDING', 'FAILED', 'PROCESSING', 'REFUNDED']
      
      // Simulate different payment scenarios
      const randomMethod = paymentMethods[index % paymentMethods.length]
      const randomStatus = index < 5 ? 'PENDING' : (index < 10 ? 'FAILED' : 'COMPLETED')

      return {
        id: `pay-${trip.id}`,
        paymentNumber: `PAY${String(index + 1).padStart(6, '0')}`,
        invoiceId: `inv-${trip.id}`,
        invoiceNumber: `INV${String(index + 1).padStart(6, '0')}`,
        customerId: trip.customerId,
        customerName: trip.customer.name,
        amount: trip.price,
        currency: trip.currency || 'SAR',
        paymentMethod: randomMethod,
        status: randomStatus,
        transactionId: randomStatus === 'COMPLETED' ? `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
        gatewayResponse: randomStatus === 'FAILED' ? 'Insufficient funds' : (randomStatus === 'COMPLETED' ? 'Payment successful' : null),
        paidAt: randomStatus === 'COMPLETED' ? trip.deliveredDate : null,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      invoiceId,
      customerId,
      amount,
      currency = 'SAR',
      paymentMethod,
      transactionId,
    } = body

    // Validate required fields
    if (!invoiceId || !customerId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate payment number
    const paymentCount = await db.trip.count() // Using trip count as proxy
    const paymentNumber = `PAY${String(paymentCount + 1).padStart(6, '0')}`

    // In a real application, you would:
    // 1. Create a payment record in the database
    // 2. Process the payment through a payment gateway
    // 3. Update the invoice status
    // 4. Send confirmation emails

    const mockPayment = {
      id: `pay-${Date.now()}`,
      paymentNumber,
      invoiceId,
      invoiceNumber: `INV${String(paymentCount + 1).padStart(6, '0')}`,
      customerId,
      customerName: "Mock Customer",
      amount: parseFloat(amount),
      currency,
      paymentMethod,
      status: 'PROCESSING',
      transactionId: transactionId || `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      gatewayResponse: null,
      paidAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(mockPayment, { status: 201 })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
