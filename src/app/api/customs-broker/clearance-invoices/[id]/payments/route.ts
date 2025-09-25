import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/customs-broker/clearance-invoices/[id]/payments - Get payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the customs broker profile
    const customsBroker = await db.customsBroker.findUnique({
      where: { userId: session.user.id }
    });

    if (!customsBroker) {
      return NextResponse.json(
        { error: "Customs broker profile not found" },
        { status: 404 }
      );
    }

    // Verify invoice belongs to this customs broker
    const invoice = await db.customsClearanceInvoice.findFirst({
      where: {
        id,
        customsBrokerId: customsBroker.id
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get payment history
    const payments = await db.clearancePayment.findMany({
      where: {
        invoiceId: id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/customs-broker/clearance-invoices/[id]/payments - Add new payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethod, notes, paymentDate } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "يرجى اختيار طريقة الدفع" },
        { status: 400 }
      );
    }

    // Get the customs broker profile
    const customsBroker = await db.customsBroker.findUnique({
      where: { userId: session.user.id }
    });

    if (!customsBroker) {
      return NextResponse.json(
        { error: "Customs broker profile not found" },
        { status: 404 }
      );
    }

    // Get current invoice details
    const invoice = await db.customsClearanceInvoice.findFirst({
      where: {
        id,
        customsBrokerId: customsBroker.id
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if invoice is already fully paid
    if (invoice.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Invoice is already fully paid" },
        { status: 400 }
      );
    }

    // Check if payment amount is valid
    const currentPaid = invoice.amountPaid || 0;
    const remaining = invoice.total - currentPaid;

    // Check if remaining amount is 0 or less
    if (remaining <= 0) {
      return NextResponse.json(
        { error: "Invoice is fully paid, no additional payments allowed" },
        { status: 400 }
      );
    }

    if (amount > remaining) {
      return NextResponse.json(
        {
          error: `Payment amount cannot exceed remaining balance of ${remaining.toFixed(
            2
          )}`
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.clearancePayment.create({
        data: {
          invoiceId: id,
          amount,
          paymentMethod,
          notes,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Calculate new totals
      const newAmountPaid = currentPaid + amount;
      const newRemainingAmount = invoice.total - newAmountPaid;

      // Determine new payment status
      let newPaymentStatus = invoice.paymentStatus;
      if (newRemainingAmount <= 0) {
        newPaymentStatus = "PAID";
      } else if (newAmountPaid > 0 && invoice.paymentStatus === "PENDING") {
        newPaymentStatus = "PARTIAL";
      }

      // Update installment tracking if applicable
      let updateData: any = {
        amountPaid: newAmountPaid,
        remainingAmount: newRemainingAmount,
        paymentStatus: newPaymentStatus,
        updatedAt: new Date()
      };

      // If this is an installment payment, update installment tracking
      if (
        invoice.paymentStatus === "INSTALLMENT" &&
        invoice.installmentAmount
      ) {
        const newInstallmentsPaid = Math.floor(
          newAmountPaid / invoice.installmentAmount
        );
        updateData.installmentsPaid = newInstallmentsPaid;

        // Calculate next installment date if not fully paid
        if (
          newPaymentStatus !== "PAID" &&
          invoice.installmentCount &&
          newInstallmentsPaid < invoice.installmentCount
        ) {
          const nextInstallmentDate = new Date();
          nextInstallmentDate.setMonth(nextInstallmentDate.getMonth() + 1);
          updateData.nextInstallmentDate = nextInstallmentDate;
        } else {
          updateData.nextInstallmentDate = null;
        }
      }

      // Set paid date if fully paid
      if (newPaymentStatus === "PAID") {
        updateData.paidDate = new Date();
      }

      // Update invoice
      const updatedInvoice = await tx.customsClearanceInvoice.update({
        where: { id },
        data: updateData
      });

      return { payment, updatedInvoice };
    });

    // Return updated invoice data
    const updatedInvoiceData = {
      id: result.updatedInvoice.id,
      amountPaid: result.updatedInvoice.amountPaid || 0,
      remainingAmount: result.updatedInvoice.remainingAmount || 0,
      paymentStatus: result.updatedInvoice.paymentStatus,
      installmentsPaid: result.updatedInvoice.installmentsPaid || 0,
      nextInstallmentDate:
        result.updatedInvoice.nextInstallmentDate?.toISOString(),
      paidDate: result.updatedInvoice.paidDate?.toISOString()
    };

    return NextResponse.json({
      payment: result.payment,
      invoice: updatedInvoiceData
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
