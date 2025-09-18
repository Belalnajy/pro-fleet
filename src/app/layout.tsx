import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import "@/styles/rtl.css";
import "@/styles/map.css";
import { Toaster as SonnarToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { SessionProviderWrapper } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { locales, type Locale } from "@/lib/types";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

// Arabic font (for Arabic UI)
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: 'swap',
  preload: true,
});

// Urdu Nastaliq font (for Urdu UI)
const notoUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "PRO FLEET - Smart Fleet Management",
  description: "Comprehensive fleet management and logistics platform for modern businesses. Real-time tracking, trip management, and financial analytics.",
  keywords: ["PRO FLEET", "Fleet Management", "Logistics", "GPS Tracking", "Trip Management", "Vehicle Management"],
  authors: [{ name: "PRO FLEET Team" }],
  openGraph: {
    title: "PRO FLEET - Smart Fleet Management",
    description: "Comprehensive fleet management and logistics platform for modern businesses",
    siteName: "PRO FLEET",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRO FLEET - Smart Fleet Management",
    description: "Comprehensive fleet management and logistics platform",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Get the locale from middleware headers
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'en';
  
  // Set direction based on locale
  const direction = (locale === 'ar' || locale === 'ur') ? 'rtl' : 'ltr';

  // Include all font variables to prevent hydration mismatch
  const allFontClasses = `${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} ${notoUrdu.variable}`;

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${allFontClasses} antialiased`} suppressHydrationWarning>
        <SessionProviderWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
            storageKey="profleet-theme"
          >
            <LanguageProvider initialLocale={locale as Locale}>
              {children}
              <Toaster />
              <SonnarToaster />
            </LanguageProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
