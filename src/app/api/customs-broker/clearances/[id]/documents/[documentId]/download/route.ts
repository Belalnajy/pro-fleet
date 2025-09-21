import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { readFile } from "fs/promises"
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

    try {
      const filePath = join(process.cwd(), document.filePath)
      const fileBuffer = await readFile(filePath)

      const response = new NextResponse(fileBuffer)
      response.headers.set('Content-Type', document.mimeType)
      response.headers.set('Content-Disposition', `attachment; filename="${document.documentName}"`)
      response.headers.set('Content-Length', document.fileSize.toString())

      return response
    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
  } catch (error) {
    console.error('Error downloading customs document:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
