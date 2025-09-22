import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify clearance belongs to this customs broker
    const clearance = await prisma.customsClearance.findUnique({
      where: { 
        id,
        customsBrokerId: session.user.id
      }
    })

    if (!clearance) {
      return NextResponse.json({ error: "Clearance not found" }, { status: 404 })
    }

    const documents = await prisma.customsDocument.findMany({
      where: {
        clearanceId: id
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching customs documents:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify clearance belongs to this customs broker
    const clearance = await prisma.customsClearance.findUnique({
      where: { 
        id,
        customsBrokerId: session.user.id
      }
    })

    if (!clearance) {
      return NextResponse.json({ error: "Clearance not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const documentName = formData.get('documentName') as string

    if (!file || !documentType || !documentName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create uploads directory - use /tmp in production, uploads in development
    const uploadsDir = process.env.NODE_ENV === 'production' 
      ? join('/tmp', 'customs-documents')
      : join(process.cwd(), 'uploads', 'customs-documents')
    
    console.log('Creating uploads directory:', uploadsDir)
    try {
      await mkdir(uploadsDir, { recursive: true })
      console.log('Directory created successfully')
    } catch (error) {
      console.error('Error creating directory:', error)
      // Directory might already exist, continue
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${clearance.clearanceNumber}_${documentType}_${timestamp}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    console.log('Saving file to:', filePath)
    try {
      await writeFile(filePath, buffer)
      console.log('File saved successfully')
    } catch (writeError) {
      console.error('Error saving file:', writeError)
      throw writeError
    }

    // Save document record to database
    const relativePath = process.env.NODE_ENV === 'production'
      ? `tmp/customs-documents/${fileName}`
      : `uploads/customs-documents/${fileName}`
    
    console.log('Saving document record with path:', relativePath)
    const document = await prisma.customsDocument.create({
      data: {
        clearanceId: id,
        documentType: documentType as any,
        documentName,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream'
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error uploading customs document:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
