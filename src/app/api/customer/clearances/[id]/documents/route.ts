import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clearanceId = params.id

    // Verify that the clearance belongs to the customer
    const clearance = await db.customsClearance.findFirst({
      where: {
        id: clearanceId,
        invoice: {
          trip: {
            customerId: session.user.id
          }
        }
      },
      include: {
        documents: true,
        invoice: {
          include: {
            trip: {
              include: {
                fromCity: true,
                toCity: true
              }
            }
          }
        },
        customsBroker: {
          select: {
            name: true
          }
        }
      }
    })

    if (!clearance) {
      return NextResponse.json({ error: "Clearance not found" }, { status: 404 })
    }

    // For now, we'll generate a mock PDF response
    // In a real implementation, you would:
    // 1. Fetch actual documents from storage
    // 2. Generate a PDF with clearance details
    // 3. Return the PDF file

    // Mock PDF content (you would replace this with actual PDF generation)
    const pdfContent = generateMockPDF(clearance)
    
    return new NextResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="clearance-${clearance.clearanceNumber}-documents.pdf"`
      }
    })

  } catch (error) {
    console.error('Error downloading clearance documents:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function generateMockPDF(clearance: any): Buffer {
  // This is a mock implementation
  // In a real app, you would use a PDF library like jsPDF, PDFKit, or Puppeteer
  
  const mockPdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(Customs Clearance Document) Tj
0 -20 Td
(Clearance Number: ${clearance.clearanceNumber}) Tj
0 -20 Td
(Invoice Number: ${clearance.invoice.invoiceNumber}) Tj
0 -20 Td
(Trip: ${clearance.invoice.trip.fromCity.name} to ${clearance.invoice.trip.toCity.name}) Tj
0 -20 Td
(Status: ${clearance.status}) Tj
0 -20 Td
(Total Fees: ${clearance.totalFees} SAR) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000526 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF
`

  return Buffer.from(mockPdfContent, 'utf-8')
}
