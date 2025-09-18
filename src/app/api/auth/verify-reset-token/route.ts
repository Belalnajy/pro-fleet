import { NextRequest, NextResponse } from 'next/server'
import { verifyResetToken } from '@/lib/password-reset'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'الرمز مطلوب' },
        { status: 400 }
      )
    }

    const result = await verifyResetToken(token)

    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
