import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { calculatePaymentStatus, validatePaymentAmount, PaymentStatus } from "@/lib/payment-calculator";

// GET - Get payment history for an invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const payments = await prisma.payment.findMany({
      where: { invoiceId: id },
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            total: true
          }
        }
      }
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST - Add a new payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { amount, paymentMethod, reference, notes } = body;

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

    // Get current invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: true
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

    // Calculate current totals
    const currentAmountPaid = invoice.amountPaid || 0;
    const currentRemainingAmount = invoice.total - currentAmountPaid;

    // Check if remaining amount is 0 or less
    if (currentRemainingAmount <= 0) {
      return NextResponse.json(
        { error: "Invoice is fully paid, no additional payments allowed" },
        { status: 400 }
      );
    }

    // التحقق من صحة مبلغ الدفعة باستخدام الدالة المساعدة
    const paymentValidation = validatePaymentAmount(
      amount,
      {
        total: invoice.total,
        dueDate: invoice.dueDate,
        installmentCount: invoice.installmentCount,
        installmentAmount: invoice.installmentAmount,
        currentAmountPaid: currentAmountPaid,
        currentPaymentStatus: invoice.paymentStatus as PaymentStatus
      },
      invoice.payments.map(p => ({ amount: p.amount, paymentDate: p.paymentDate }))
    );

    if (!paymentValidation.isValid) {
      return NextResponse.json(
        { error: paymentValidation.error },
        { status: 400 }
      );
    }

    // حساب حالة المدفوعات الجديدة
    const paymentCalculation = calculatePaymentStatus(
      {
        total: invoice.total,
        dueDate: invoice.dueDate,
        installmentCount: invoice.installmentCount,
        installmentAmount: invoice.installmentAmount,
        currentAmountPaid: currentAmountPaid,
        currentPaymentStatus: invoice.paymentStatus as PaymentStatus
      },
      invoice.payments.map(p => ({ amount: p.amount, paymentDate: p.paymentDate })),
      amount
    );

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
    });

    // تحديث الفاتورة بالحالة الجديدة المحسوبة
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: paymentCalculation.amountPaid,
        remainingAmount: paymentCalculation.remainingAmount,
        paymentStatus: paymentCalculation.paymentStatus,
        paidDate: paymentCalculation.isFullyPaid ? new Date() : invoice.paidDate,
        installmentsPaid: paymentCalculation.installmentsPaid,
        nextInstallmentDate: paymentCalculation.nextInstallmentDate
      },
      include: {
        payments: {
          orderBy: { paymentDate: "desc" }
        },
        trip: {
          include: {
            customer: true
          }
        }
      }
    });

    return NextResponse.json({
      payment,
      invoice: updatedInvoice,
      message: "Payment added successfully"
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    return NextResponse.json(
      { error: "Failed to add payment" },
      { status: 500 }
    );
  }
}
