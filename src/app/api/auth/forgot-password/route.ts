import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendEmail, getPasswordResetEmailTemplate } from "@/lib/email";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, locale } = await request.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "صيغة البريد الإلكتروني غير صحيحة" },
        { status: 400 }
      );
    }

    // Create reset token
    const result = await createPasswordResetToken(email.toLowerCase());

    // Get user name for email template
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { name: true }
    });

    // Generate reset URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/${locale || "ar"}/auth/reset-password?token=${
      result.token
    }`;

    // Send email
    if (result.success) {
      const emailTemplate = getPasswordResetEmailTemplate(
        resetUrl,
        user?.name || "المستخدم"
      );
      try {
        await sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        });
      } catch (e) {
        console.error("Failed to send reset email for", email, e);
      }
    }

    // Always return generic response to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "إذا كان البريد مسجلاً لدينا فستصلك رسالة بباقي الخطوات"
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
