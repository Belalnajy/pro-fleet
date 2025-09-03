import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { Toaster as SonnarToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { SessionProviderWrapper } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Arabic font (for Arabic UI)
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

// Urdu Nastaliq font (for Urdu UI) - disable preload to avoid subset error
const notoUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  weight: ["400"],
  preload: false,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} ${notoUrdu.variable} antialiased font-sans bg-background text-foreground`}
      >
        <SessionProviderWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LanguageProvider>
              {children}
              <SonnarToaster />
              <Toaster />
            </LanguageProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
