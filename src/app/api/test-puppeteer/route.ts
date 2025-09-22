import { NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function GET() {
  try {
    console.log("Testing Puppeteer configuration...")
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("PUPPETEER_EXECUTABLE_PATH:", process.env.PUPPETEER_EXECUTABLE_PATH)
    
    // Test Chrome/Chromium availability
    const executablePath = process.env.NODE_ENV === 'production' 
      ? process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
      : undefined
    
    console.log("Attempting to launch browser with executablePath:", executablePath)
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      // For Vercel/serverless, don't specify executablePath to use bundled Chromium
      ...(process.env.VERCEL ? {} : { executablePath })
    })
    
    console.log("Browser launched successfully")
    
    const page = await browser.newPage()
    console.log("New page created")
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test PDF</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Puppeteer Test</h1>
          <p>This is a test PDF generated on ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
          <p>Executable Path: ${executablePath || 'Default'}</p>
        </body>
      </html>
    `, { waitUntil: 'networkidle0' })
    
    console.log("Content set successfully")
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })
    
    console.log("PDF generated successfully, size:", pdfBuffer.length)
    
    await browser.close()
    console.log("Browser closed")
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="puppeteer-test.pdf"'
      }
    })
    
  } catch (error) {
    console.error("Puppeteer test failed:", error)
    
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json({
      error: "Puppeteer test failed",
      message: (error as Error).message,
      environment: process.env.NODE_ENV,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      suggestions: [
        "Make sure Chrome/Chromium is installed",
        "Set PUPPETEER_EXECUTABLE_PATH environment variable",
        "Check server permissions for /tmp directory",
        "Verify Chrome binary is executable"
      ]
    }, { status: 500 })
  }
}
