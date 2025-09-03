"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageSelector } from "@/components/ui/language-selector"
import { Truck, Shield, Users, Calculator, FileText, ArrowRight, Globe } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      switch (session.user.role) {
        case "ADMIN":
          router.push("/admin")
          break
        case "DRIVER":
          router.push("/driver")
          break
        case "CUSTOMER":
          router.push("/customer")
          break
        case "ACCOUNTANT":
          router.push("/accountant")
          break
        case "CUSTOMS_BROKER":
          router.push("/customs-broker")
          break
      }
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary">PRO FLEET</h1>
              <p className="text-xs text-muted-foreground">Smart Fleet. Smart Future.</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <ThemeToggle />
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Smart Fleet Management
            <span className="text-primary block">For Modern Businesses</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comprehensive logistics platform with real-time tracking, trip management, 
            and powerful analytics for fleet operations of any size.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Admin Dashboard</CardTitle>
                  <CardDescription>Complete control over all operations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• User management and roles</li>
                <li>• Vehicle and pricing management</li>
                <li>• Real-time analytics and reporting</li>
                <li>• System configuration and settings</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Truck className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle>Driver Portal</CardTitle>
                  <CardDescription>Efficient trip management</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• View assigned trips</li>
                <li>• Real-time GPS tracking</li>
                <li>• Status updates and alerts</li>
                <li>• Digital documentation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle>Customer Portal</CardTitle>
                  <CardDescription>Easy booking and tracking</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Online trip booking</li>
                <li>• Real-time shipment tracking</li>
                <li>• Digital invoicing</li>
                <li>• Payment processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Calculator className="h-8 w-8 text-purple-600" />
                <div>
                  <CardTitle>Accountant Portal</CardTitle>
                  <CardDescription>Financial management</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Invoice management</li>
                <li>• Payment tracking</li>
                <li>• Financial reporting</li>
                <li>• Export to Excel/PDF</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-orange-600" />
                <div>
                  <CardTitle>Customs Broker</CardTitle>
                  <CardDescription>Clearance management</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Customs fee management</li>
                <li>• Tax calculation</li>
                <li>• Documentation processing</li>
                <li>• Compliance tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-600">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Truck className="h-8 w-8 text-red-600" />
                <div>
                  <CardTitle>Real-time Tracking</CardTitle>
                  <CardDescription>Live GPS monitoring</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Live vehicle tracking</li>
                <li>• Route optimization</li>
                <li>• Temperature monitoring</li>
                <li>• Delivery alerts</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Demo Accounts Section */}
        <div className="bg-muted/50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">🔐 Demo Accounts</h2>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
            Experience the full power of PRO FLEET with our demo accounts. Each role has unique capabilities and sample data.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">Admin</CardTitle>
                    <CardDescription>Complete system control</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> admin@profleet.com</div>
                  <div><strong>Password:</strong> demo123</div>
                  <div className="text-muted-foreground">
                    Full access to all features, user management, analytics, and system configuration.
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/auth/signin?demo=admin">
                    <Button className="w-full" variant="outline">
                      Try Admin Demo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Truck className="h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle className="text-lg">Driver</CardTitle>
                    <CardDescription>Trip management</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> driver@profleet.com</div>
                  <div><strong>Password:</strong> demo123</div>
                  <div className="text-muted-foreground">
                    View assigned trips, GPS tracking, status updates, and digital documentation.
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/auth/signin?demo=driver">
                    <Button className="w-full" variant="outline">
                      Try Driver Demo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div>
                    <CardTitle className="text-lg">Customer</CardTitle>
                    <CardDescription>Booking & tracking</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> customer@profleet.com</div>
                  <div><strong>Password:</strong> demo123</div>
                  <div className="text-muted-foreground">
                    Online trip booking, real-time tracking, invoicing, and payment processing.
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/auth/signin?demo=customer">
                    <Button className="w-full" variant="outline">
                      Try Customer Demo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-600">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Calculator className="h-8 w-8 text-orange-600" />
                  <div>
                    <CardTitle className="text-lg">Accountant</CardTitle>
                    <CardDescription>Financial management</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> accountant@profleet.com</div>
                  <div><strong>Password:</strong> demo123</div>
                  <div className="text-muted-foreground">
                    Invoice management, payment tracking, financial reports, and data export.
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/auth/signin?demo=accountant">
                    <Button className="w-full" variant="outline">
                      Try Accountant Demo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-600">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-red-600" />
                  <div>
                    <CardTitle className="text-lg">Customs Broker</CardTitle>
                    <CardDescription>Clearance management</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> broker@profleet.com</div>
                  <div><strong>Password:</strong> demo123</div>
                  <div className="text-muted-foreground">
                    Customs clearance, fee calculation, VAT processing, and compliance.
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/auth/signin?demo=broker">
                    <Button className="w-full" variant="outline">
                      Try Broker Demo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-600">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Globe className="h-8 w-8 text-indigo-600" />
                  <div>
                    <CardTitle className="text-lg">Multi-Language</CardTitle>
                    <CardDescription>International support</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Languages:</strong> English, Arabic, Urdu</div>
                  <div><strong>Features:</strong> RTL support, localized content</div>
                  <div className="text-muted-foreground">
                    Full internationalization with right-to-left layout support for Arabic and Urdu.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              💡 <strong>Pro Tip:</strong> Use the language selector in the top navigation to switch between English, Arabic (العربية), and Urdu (اردو).
            </p>
            <p className="text-sm text-muted-foreground">
              🌙 <strong>Theme:</strong> Toggle between light and dark mode using the theme button in the top navigation.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fleet Operations?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust PRO FLEET for their logistics needs. 
            Start your free trial today and experience the future of fleet management.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Truck className="h-6 w-6 text-primary" />
              <span className="font-semibold">PRO FLEET</span>
            </div>
            <div className="text-center md:text-right text-sm text-muted-foreground">
              <p>&copy; 2024 PRO FLEET. All rights reserved.</p>
              <p>Smart Fleet. Smart Future.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}