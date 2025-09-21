import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { readFile, unlink } from "fs/promises"
import { join } from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document = await prisma.customsDocument.findUnique({
      where: { 
        id: documentId,
        clearanceId: id
      },
      include: {
        clearance: true
      }
    })

    if (!document || document.clearance.customsBrokerId !== session.user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching customs document:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    const document = await prisma.customsDocument.findUnique({
      where: { 
        id: documentId,
        clearanceId: id
      },
      include: {
        clearance: true
      }
    })

    if (!document || document.clearance.customsBrokerId !== session.user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const updatedDocument = await prisma.customsDocument.update({
      where: { id: documentId },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(status && { reviewedAt: new Date(), reviewedBy: session.user.id })
      }
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('Error updating customs document:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document = await prisma.customsDocument.findUnique({
      where: { 
        id: documentId,
        clearanceId: id
      },
      include: {
        clearance: true
      }
    })

    if (!document || document.clearance.customsBrokerId !== session.user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), document.filePath)
      await unlink(filePath)
    } catch (error) {
      console.error('Error deleting file:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete document record from database
    await prisma.customsDocument.delete({
      where: { id: documentId }
    })

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error('Error deleting customs document:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
