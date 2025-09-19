import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First get basic user info
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get role-specific profile data separately
    let roleProfile: any = null
    try {
      switch (user.role) {
        case 'DRIVER':
          roleProfile = await db.driver.findUnique({
            where: { userId: user.id }
          })
          break
        case 'CUSTOMER':
          roleProfile = await db.customer.findUnique({
            where: { userId: user.id }
          })
          break
        case 'ACCOUNTANT':
          roleProfile = await db.accountant.findUnique({
            where: { userId: user.id }
          })
          break
        case 'CUSTOMS_BROKER':
          roleProfile = await db.customsBroker.findUnique({
            where: { userId: user.id }
          })
          break
      }
    } catch (profileError) {
      console.log('Profile fetch error (non-critical):', profileError)
      // Continue without role profile if it doesn't exist
    }

    // Combine user data with role profile
    const response: any = {
      ...user,
      [`${user.role.toLowerCase()}Profile`]: roleProfile
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, profileData } = body

    // Update basic user info
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
      }
    })

    // Update role-specific profile data if provided
    if (profileData) {
      try {
        switch (session.user.role) {
          case 'DRIVER':
            await db.driver.update({
              where: { userId: session.user.id },
              data: profileData
            })
            break
          case 'CUSTOMER':
            await db.customer.update({
              where: { userId: session.user.id },
              data: profileData
            })
            break
          case 'ACCOUNTANT':
            await db.accountant.update({
              where: { userId: session.user.id },
              data: profileData
            })
            break
          case 'CUSTOMS_BROKER':
            await db.customsBroker.update({
              where: { userId: session.user.id },
              data: profileData
            })
            break
        }
      } catch (profileUpdateError) {
        console.log('Profile update error (non-critical):', profileUpdateError)
      }
    }

    // Return updated user data
    return NextResponse.json({
      ...updatedUser,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
