import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePaymentStatus, validatePaymentAmount, PaymentStatus } from "@/lib/payment-calculator";

// GET /api/accountant/invoices/[id]/payments - Get payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const payments = await db.payment.findMany({
      where: {
        invoiceId: id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/accountant/invoices/[id]/payments - Add new payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMethod, reference, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "يرجى اختيار طريقة الدفع" },
        { status: 400 }
      );
    }

    // Get current invoice
    const invoice = await db.invoice.findUnique({
      where: { id }
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

    // جلب المدفوعات الحالية للحسابات
    const currentPayments = await db.payment.findMany({
      where: { invoiceId: id },
      select: { amount: true, paymentDate: true }
    });

    // التحقق من صحة مبلغ الدفعة
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
      currentPayments.map(p => ({ amount: p.amount, paymentDate: p.paymentDate }))
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
      currentPayments.map(p => ({ amount: p.amount, paymentDate: p.paymentDate })),
      amount
    );

    // Create payment record and update invoice in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId: id,
          amount,
          paymentMethod: paymentMethod || "cash",
          reference,
          notes,
          createdBy: session.user.id
        }
      });

      // تحديث الفاتورة بالحالة الجديدة
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          amountPaid: paymentCalculation.amountPaid,
          remainingAmount: paymentCalculation.remainingAmount,
          paymentStatus: paymentCalculation.paymentStatus,
          installmentsPaid: paymentCalculation.installmentsPaid,
          nextInstallmentDate: paymentCalculation.nextInstallmentDate,
          paidDate: paymentCalculation.isFullyPaid ? new Date() : invoice.paidDate
        }
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
