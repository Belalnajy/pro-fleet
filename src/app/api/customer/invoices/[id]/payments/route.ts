import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePaymentStatus, validatePaymentAmount, PaymentStatus } from "@/lib/payment-calculator";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoiceId = params.id;

    // Verify the invoice belongs to the customer
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        trip: {
          customerId: session.user.id
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch payments for this invoice
    console.log('Fetching payments for invoice ID:', invoiceId)
    const payments = await db.payment.findMany({
      where: { invoiceId: invoiceId },
      orderBy: { createdAt: "desc" }
    });
    
    console.log('Found payments:', payments.length, payments)
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching invoice payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoiceId = params.id;
    const { amount, paymentMethod, reference, notes } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "يرجى اختيار طريقة الدفع" },
        { status: 400 }
      );
    }

    // Verify the invoice belongs to the customer and get current state
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        trip: {
          customerId: session.user.id
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 }
      );
    }

    const currentAmountPaid = invoice.amountPaid || 0;
    const remainingAmount = invoice.total - currentAmountPaid;

    // Check if invoice is fully paid (remaining amount is 0 or less)
    if (remainingAmount <= 0) {
      return NextResponse.json(
        {
          error: "Invoice is fully paid, no additional payments allowed"
        },
        { status: 400 }
      );
    }

    // جلب المدفوعات الحالية
    const currentPayments = await db.payment.findMany({
      where: { invoiceId },
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

    // استخدام transaction لضمان تسق البيانات
    const result = await db.$transaction(async (tx) => {
      // إنشاء سجل الدفعة
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoiceId,
          amount: amount,
          paymentMethod: paymentMethod || "cash",
          reference: reference || null,
          notes: notes || null,
          paymentDate: new Date(),
          createdBy: session.user.id
        }
      });

      // تحديث حالة الفاتورة
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
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

    console.log(`✅ Payment of ${amount} added to invoice ${invoiceId}`);

    return NextResponse.json({
      message: "Payment added successfully",
      payment: result.payment,
      invoice: result.invoice
    });
  } catch (error) {
    console.error("Error adding invoice payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
