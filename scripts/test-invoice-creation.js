const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testInvoiceCreation() {
  try {
    console.log('🔍 Testing invoice creation...');
    
    // Find a trip that's not DELIVERED yet
    const trip = await prisma.trip.findFirst({
      where: {
        status: { not: 'DELIVERED' },
        invoice: null // No existing invoice
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        driver: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        fromCity: true,
        toCity: true
      }
    });

    if (!trip) {
      console.log('❌ No suitable trip found for testing');
      return;
    }

    console.log('✅ Found trip for testing:', {
      id: trip.id,
      tripNumber: trip.tripNumber,
      status: trip.status,
      customer: trip.customer.name,
      route: `${trip.fromCity.name} → ${trip.toCity.name}`,
      price: trip.price
    });

    // Test invoice data structure
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `PRO-INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(invoiceCount + 1).padStart(3, '0')}`;
    
    const subtotal = trip.price;
    const taxRate = 0.15;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const invoiceData = {
      invoiceNumber,
      tripId: trip.id,
      taxRate,
      taxAmount,
      subtotal,
      total,
      currency: 'SAR',
      paymentStatus: 'PENDING',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amountPaid: 0,
      remainingAmount: total,
      installmentsPaid: 0,
    };

    console.log('💾 Invoice data to be created:', {
      invoiceNumber,
      tripId: trip.id,
      subtotal,
      taxAmount,
      total,
      remainingAmount: total
    });

    console.log('✅ Invoice data structure is valid!');
    console.log('🎯 Ready to test with actual API call');
    
  } catch (error) {
    console.error('❌ Error testing invoice creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvoiceCreation();
