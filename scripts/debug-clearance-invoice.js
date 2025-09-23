const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugClearanceInvoice() {
  try {
    console.log('🔍 Checking invoice INV-000011...')
    
    // Find the invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: 'INV-000011'
      },
      include: {
        trip: {
          select: {
            id: true,
            customerId: true
          }
        }
      }
    })

    if (!invoice) {
      console.log('❌ Invoice INV-000011 not found')
      return
    }

    console.log('✅ Invoice found:', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.trip.customerId
    })

    // Check for customs clearance
    const clearance = await prisma.customsClearance.findFirst({
      where: {
        invoiceId: invoice.id
      },
      include: {
        customsBroker: {
          select: {
            name: true
          }
        }
      }
    })

    if (!clearance) {
      console.log('❌ No customs clearance found for this invoice')
      return
    }

    console.log('✅ Customs clearance found:', {
      id: clearance.id,
      clearanceNumber: clearance.clearanceNumber,
      status: clearance.status,
      customsBroker: clearance.customsBroker.name,
      totalFees: clearance.totalFees
    })

    // Check for customs clearance invoice
    const clearanceInvoice = await prisma.customsClearanceInvoice.findFirst({
      where: {
        clearanceId: clearance.id
      }
    })

    if (!clearanceInvoice) {
      console.log('❌ No customs clearance invoice found for this clearance')
      console.log('🔧 This is the problem! Creating clearance invoice...')
      
      // Generate clearance invoice number
      const clearanceInvoiceCount = await prisma.customsClearanceInvoice.count()
      const clearanceInvoiceNumber = `CI-${String(clearanceInvoiceCount + 1).padStart(6, '0')}`

      // Get customs broker
      const customsBroker = await prisma.customsBroker.findFirst({
        where: {
          userId: clearance.customsBrokerId
        }
      })

      if (!customsBroker) {
        console.log('❌ Customs broker not found')
        return
      }

      // Calculate invoice amounts
      const subtotal = clearance.totalFees
      const taxRate = 0.15 // 15% VAT
      const taxAmount = subtotal * taxRate
      const total = subtotal + taxAmount

      // Create the clearance invoice
      const newClearanceInvoice = await prisma.customsClearanceInvoice.create({
        data: {
          invoiceNumber: clearanceInvoiceNumber,
          clearanceId: clearance.id,
          customsBrokerId: customsBroker.id,
          customsFee: clearance.customsFee,
          additionalFees: clearance.additionalFees,
          subtotal,
          taxRate,
          taxAmount,
          total,
          remainingAmount: total,
          dueDate: clearance.estimatedCompletionDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: clearance.notes
        }
      })

      console.log('✅ Created clearance invoice:', {
        id: newClearanceInvoice.id,
        invoiceNumber: newClearanceInvoice.invoiceNumber,
        total: newClearanceInvoice.total
      })
    } else {
      console.log('✅ Customs clearance invoice found:', {
        id: clearanceInvoice.id,
        invoiceNumber: clearanceInvoice.invoiceNumber,
        total: clearanceInvoice.total,
        paymentStatus: clearanceInvoice.paymentStatus
      })
    }

    // Now check what the customer API would return
    console.log('\n🔍 Testing customer clearance invoices API...')
    const customerClearanceInvoices = await prisma.customsClearanceInvoice.findMany({
      where: {
        clearance: {
          invoice: {
            trip: {
              customerId: invoice.trip.customerId
            }
          }
        }
      },
      include: {
        clearance: {
          include: {
            invoice: {
              include: {
                trip: {
                  select: {
                    id: true,
                    tripNumber: true,
                    fromCity: {
                      select: {
                        name: true,
                        nameAr: true
                      }
                    },
                    toCity: {
                      select: {
                        name: true,
                        nameAr: true
                      }
                    }
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
        }
      }
    })

    console.log(`📊 Customer would see ${customerClearanceInvoices.length} clearance invoices:`)
    customerClearanceInvoices.forEach(ci => {
      console.log(`  - ${ci.invoiceNumber} (${ci.clearance.invoice.invoiceNumber}) - ${ci.paymentStatus}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugClearanceInvoice()
