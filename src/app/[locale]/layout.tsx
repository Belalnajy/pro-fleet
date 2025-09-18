import { locales, type Locale } from "@/lib/types";
import { notFound } from "next/navigation";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  // Await the params to fix Next.js 15 compatibility
  const { locale } = await params;
  
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Just return children - HTML structure is handled by root layout
  return <>{children}</>;
}
