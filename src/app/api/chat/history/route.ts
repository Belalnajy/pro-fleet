import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get chat history for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get chat messages for the user
    const messages = await db.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }).catch(() => [])

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit
    })

  } catch (error) {
    console.error("Error fetching chat history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Save chat message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { userMessage, botResponse, sessionId } = body

    if (!userMessage || !botResponse) {
      return NextResponse.json(
        { error: "User message and bot response are required" },
        { status: 400 }
      )
    }

    // Save user message
    const userChatMessage = await db.chatMessage.create({
      data: {
        userId: session.user.id,
        content: userMessage,
        isBot: false,
        sessionId: sessionId || null
      }
    })

    // Save bot response
    const botChatMessage = await db.chatMessage.create({
      data: {
        userId: session.user.id,
        content: botResponse,
        isBot: true,
        sessionId: sessionId || null
      }
    })

    return NextResponse.json({
      success: true,
      userMessageId: userChatMessage.id,
      botMessageId: botChatMessage.id
    })

  } catch (error) {
    console.error("Error saving chat message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Clear chat history
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Delete specific session
      await db.chatMessage.deleteMany({
        where: { 
          userId: session.user.id,
          sessionId: sessionId
        }
      })
    } else {
      // Delete all chat history for user
      await db.chatMessage.deleteMany({
        where: { userId: session.user.id }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error clearing chat history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
