"use client"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Truck, Shield, Users, Calculator, FileText } from "lucide-react"

function SignInInner() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Demo account credentials
  const demoAccounts = {
    admin: { email: "admin@profleet.com", password: "demo123" },
    driver: { email: "driver@profleet.com", password: "demo123" },
    customer: { email: "customer@profleet.com", password: "demo123" },
    accountant: { email: "accountant@profleet.com", password: "demo123" },
    broker: { email: "broker@profleet.com", password: "demo123" },
  }

  // Helper function to redirect user based on role
  const redirectUserByRole = async () => {
    const session = await getSession()
    if (session?.user?.role) {
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
        default:
          router.push("/")
      }
    }
  }

  // Auto-login for demo accounts
  useEffect(() => {
    const demoType = searchParams.get("demo")
    if (demoType && demoAccounts[demoType as keyof typeof demoAccounts]) {
      const account = demoAccounts[demoType as keyof typeof demoAccounts]
      setEmail(account.email)
      setPassword(account.password)
      // Auto-submit the form
      handleDemoLogin(account.email, account.password)
    }
  }, [searchParams])

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: demoEmail,
        password: demoPassword,
        redirect: false,
      })

      if (result?.error) {
        setError("Demo login failed. Please try again.")
      } else {
        await redirectUserByRole()
      }
    } catch (error) {
      setError("An error occurred during demo login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        await redirectUserByRole()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Truck className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary">PRO FLEET</h1>
          <p className="text-muted-foreground mt-2">Smart Fleet. Smart Future.</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Demo Account Quick Access */}
        <div className="mt-8">
          <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">
            Try Demo Accounts
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/auth/signin?demo=admin">
              <div className="text-center p-4 bg-card rounded-lg border hover:bg-accent hover:border-primary transition-colors cursor-pointer">
                <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Admin</h3>
                <p className="text-xs text-muted-foreground">Full system access</p>
              </div>
            </Link>
            <Link href="/auth/signin?demo=driver">
              <div className="text-center p-4 bg-card rounded-lg border hover:bg-accent hover:border-primary transition-colors cursor-pointer">
                <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Driver</h3>
                <p className="text-xs text-muted-foreground">Trip management</p>
              </div>
            </Link>
            <Link href="/auth/signin?demo=customer">
              <div className="text-center p-4 bg-card rounded-lg border hover:bg-accent hover:border-primary transition-colors cursor-pointer">
                <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Customer</h3>
                <p className="text-xs text-muted-foreground">Book trips</p>
              </div>
            </Link>
            <Link href="/auth/signin?demo=accountant">
              <div className="text-center p-4 bg-card rounded-lg border hover:bg-accent hover:border-primary transition-colors cursor-pointer">
                <Calculator className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Accountant</h3>
                <p className="text-xs text-muted-foreground">Financial management</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  )
}