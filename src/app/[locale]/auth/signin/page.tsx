"use client"

import { useState, useEffect, use } from "react"
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
import { useLanguage } from "@/components/providers/language-provider"

function SignInInner({ locale }: { locale: string }) {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Demo account credentials
  const demoAccounts = {
    admin: { email: "admin@profleet.com", password: "demo1234" },
    driver: { email: "driver@profleet.com", password: "demo123" },
    customer: { email: "customer@profleet.com", password: "demo123" },
    accountant: { email: "accountant@profleet.com", password: "demo123" },
    broker: { email: "broker@profleet.sa", password: "password123" },
  }

  // Helper function to redirect user based on role
  const redirectUserByRole = async () => {
    const session = await getSession()
    if (session?.user?.role) {
      switch (session.user.role) {
        case "ADMIN":
          router.push(`/${locale}/admin`)
          break
        case "DRIVER":
          router.push(`/${locale}/driver`)
          break
        case "CUSTOMER":
          router.push(`/${locale}/customer`)
          break
        case "ACCOUNTANT":
          router.push(`/${locale}/accountant`)
          break
        case "CUSTOMS_BROKER":
          router.push(`/${locale}/customs-broker`)
          break
        default:
          router.push(`/${locale}`)
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
        setError(t("demoLoginFailed"))
      } else {
        await redirectUserByRole()
      }
    } catch (error) {
      setError(t("demoLoginError"))
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
        setError(t("invalidCredentials"))
      } else {
        await redirectUserByRole()
      }
    } catch (error) {
      setError(t("errorOccurred"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4 ">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-3">
       
          <img src="/Website-Logo.png" alt="Logo" className="w-44 h-44 mx-auto mb-4" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t("signIn")}</CardTitle>
            <CardDescription className="text-center">
              {t("enterCredentials")}
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
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("enterEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 my-5">
              <Button 
                type="submit" 
                className="w-full mx-5" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("signingIn")}
                  </>
                ) : (
                  t("signIn")
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <div>
                  {t("dontHaveAccount")}{" "}
                  <Link href={`/${locale}/auth/signup`} className="text-primary hover:underline">
                    {t("signUp")}
                  </Link>
                </div>
                <div>
                  <Link href={`/${locale}/auth/forgot-password`} className="text-primary hover:underline">
                    {t("forgotPassword")}
                  </Link>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Demo Account Quick Access */}
        <div className="mt-8">
          <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">
            {t("tryDemoAccounts")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href={`/${locale}/auth/signin?demo=admin`}>
              <div className="text-center p-4 bg-card rounded-lg border hover:bg-accent hover:border-primary transition-colors cursor-pointer">
                <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">{t("admin")}</h3>
                <p className="text-xs text-muted-foreground">{t("fullSystemAccess")}</p>
              </div>
            </Link>
            <Link href={`/${locale}/auth/signin?demo=driver`}>
              <div className="text-center p-4 bg-card rounded-lg border hover:bg-accent hover:border-primary transition-colors cursor-pointer">
                <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">{t("driver")}</h3>
                <p className="text-xs text-muted-foreground">{t("tripManagement")}</p>
              </div>
            </Link>
            <Link href={`/${locale}/auth/signin?demo=customer`}>
              <div className="text-center p-4 bg-card rounded-lg border hover:bg-accent hover:border-primary transition-colors cursor-pointer">
                <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">{t("customer")}</h3>
                <p className="text-xs text-muted-foreground">{t("bookTrips")}</p>
              </div>
            </Link>
            <Link href={`/${locale}/auth/signin?demo=accountant`}>
              <div className="text-center p-4 bg-card rounded-lg border hover:bg-accent hover:border-primary transition-colors cursor-pointer">
                <Calculator className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">{t("accountant")}</h3>
                <p className="text-xs text-muted-foreground">{t("financialManagement")}</p>
              </div>
            </Link>
            <Link href={`/${locale}/auth/signin?demo=broker`}>
              <div className="text-center p-4 bg-card rounded-lg border hover:bg-accent hover:border-primary transition-colors cursor-pointer">
                <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">{t("customsBroker")}</h3>
                <p className="text-xs text-muted-foreground">{t("customsDocuments")}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  return (
    <Suspense>
      <SignInInner locale={locale} />
    </Suspense>
  )
}