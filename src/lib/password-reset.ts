import { db } from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export interface PasswordResetResult {
  success: boolean
  message: string
  token?: string
}

/**
 * Generate a secure random token for password reset
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a password reset token for a user
 */
export const createPasswordResetToken = async (email: string): Promise<PasswordResetResult> => {
  try {
    // Check if user exists and is active
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isActive: true }
    })

    if (!user) {
      return {
        success: false,
        message: 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني'
      }
    }

    if (!user.isActive) {
      return {
        success: false,
        message: 'هذا الحساب غير نشط. يرجى التواصل مع الإدارة'
      }
    }

    // Generate token
    const token = generateResetToken()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    // Delete any existing unused tokens for this email
    await db.passwordResetToken.deleteMany({
      where: {
        email,
        used: false
      }
    })

    // Create new token
    await db.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
        used: false
      }
    })

    return {
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
      token
    }
  } catch (error) {
    console.error('Error creating password reset token:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء إنشاء رمز إعادة التعيين'
    }
  }
}

/**
 * Verify a password reset token
 */
export const verifyResetToken = async (token: string): Promise<PasswordResetResult & { email?: string }> => {
  try {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        used: true
      }
    })

    if (!resetToken) {
      return {
        success: false,
        message: 'رمز إعادة التعيين غير صحيح'
      }
    }

    if (resetToken.used) {
      return {
        success: false,
        message: 'تم استخدام هذا الرمز من قبل'
      }
    }

    if (new Date() > resetToken.expiresAt) {
      return {
        success: false,
        message: 'انتهت صلاحية رمز إعادة التعيين'
      }
    }

    return {
      success: true,
      message: 'رمز إعادة التعيين صحيح',
      email: resetToken.email
    }
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء التحقق من الرمز'
    }
  }
}

/**
 * Reset user password using token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<PasswordResetResult> => {
  try {
    // Verify token first
    const tokenVerification = await verifyResetToken(token)
    if (!tokenVerification.success || !tokenVerification.email) {
      return tokenVerification
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await db.user.update({
      where: { email: tokenVerification.email },
      data: { password: hashedPassword }
    })

    // Mark token as used
    await db.passwordResetToken.update({
      where: { token },
      data: { used: true }
    })

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    }
  } catch (error) {
    console.error('Error resetting password:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء تغيير كلمة المرور'
    }
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    await db.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    console.log('Expired password reset tokens cleaned up')
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error)
  }
}
