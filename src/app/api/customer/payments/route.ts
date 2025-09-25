import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const invoiceType = searchParams.get('invoiceType') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // جلب المدفوعات من الفواتير العادية
    const regularPayments = await prisma.payment.findMany({
      where: {
        invoice: {
          trip: {
            customerId: session.user.id
          }
        },
        ...(search && {
          OR: [
            { invoice: { invoiceNumber: { contains: search } } },
            { invoice: { trip: { tripNumber: { contains: search } } } },
            { reference: { contains: search } }
          ]
        }),
        ...(paymentMethod && { paymentMethod }),
      },
      include: {
        invoice: {
          include: {
            trip: {
              include: {
                fromCity: true,
                toCity: true,
                driver: {
                  include: {
                    user: true
                  }
                },
                customsBroker: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // جلب المدفوعات من فواتير التخليص الجمركي
    const clearancePayments = await prisma.clearancePayment.findMany({
      where: {
        invoice: {
          clearance: {
            invoice: {
              trip: {
                customerId: session.user.id
              }
            }
          }
        },
        ...(search && {
          OR: [
            { invoice: { invoiceNumber: { contains: search } } },
            { invoice: { clearance: { invoice: { trip: { tripNumber: { contains: search } } } } } },
            { reference: { contains: search } }
          ]
        }),
        ...(paymentMethod && { paymentMethod }),
      },
      include: {
        invoice: {
          include: {
            clearance: {
              include: {
                invoice: {
                  include: {
                    trip: {
                      include: {
                        fromCity: true,
                        toCity: true,
                        driver: {
                          include: {
                            user: true
                          }
                        },
                        customsBroker: {
                          include: {
                            user: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // تنسيق البيانات
    const formattedRegularPayments = regularPayments.map(payment => ({
      id: payment.id,
      invoiceNumber: payment.invoice.invoiceNumber,
      invoiceType: 'REGULAR' as const,
      tripNumber: payment.invoice.trip.tripNumber,
      route: {
        from: payment.invoice.trip.fromCity.nameAr,
        to: payment.invoice.trip.toCity.nameAr
      },
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.createdAt.toISOString(),
      reference: payment.reference,
      notes: payment.notes,
      status: payment.invoice.paymentStatus,
      total: payment.invoice.total,
      remainingAmount: payment.invoice.remainingAmount || (payment.invoice.total - (payment.invoice.amountPaid || 0)),
      driver: payment.invoice.trip.driver ? {
        name: payment.invoice.trip.driver.user.name
      } : null,
      customsBroker: payment.invoice.trip.customsBroker ? {
        name: payment.invoice.trip.customsBroker.user.name
      } : null
    }))

    const formattedClearancePayments = clearancePayments.map(payment => ({
      id: payment.id,
      invoiceNumber: payment.invoice.invoiceNumber,
      invoiceType: 'CLEARANCE' as const,
      tripNumber: payment.invoice.clearance.invoice.trip.tripNumber,
      route: {
        from: payment.invoice.clearance.invoice.trip.fromCity.nameAr,
        to: payment.invoice.clearance.invoice.trip.toCity.nameAr
      },
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.createdAt.toISOString(),
      reference: payment.reference,
      notes: payment.notes,
      status: payment.invoice.paymentStatus,
      total: payment.invoice.total,
      remainingAmount: payment.invoice.remainingAmount || (payment.invoice.total - (payment.invoice.amountPaid || 0)),
      driver: payment.invoice.clearance.invoice.trip.driver ? {
        name: payment.invoice.clearance.invoice.trip.driver.user.name
      } : null,
      customsBroker: payment.invoice.clearance.invoice.trip.customsBroker ? {
        name: payment.invoice.clearance.invoice.trip.customsBroker.user.name
      } : null
    }))

    // دمج وترتيب المدفوعات
    const allPayments = [...formattedRegularPayments, ...formattedClearancePayments]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())

    // تطبيق الفلاتر
    let filteredPayments = allPayments
    
    if (invoiceType) {
      filteredPayments = filteredPayments.filter(p => p.invoiceType === invoiceType)
    }
    
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status)
    }

    // حساب الإحصائيات
    const totalStats = {
      totalPayments: filteredPayments.length,
      totalAmount: filteredPayments.reduce((sum, payment) => sum + payment.amount, 0),
      paidInvoices: filteredPayments.filter(p => p.status === 'PAID').length,
      pendingAmount: filteredPayments.reduce((sum, payment) => sum + payment.remainingAmount, 0)
    }

    // تطبيق الترقيم
    const paginatedPayments = filteredPayments.slice(skip, skip + limit)
    const totalCount = filteredPayments.length
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      payments: paginatedPayments,
      stats: totalStats,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit
      }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
