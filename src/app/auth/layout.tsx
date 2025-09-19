export const metadata = {
  title: 'PRO FLEET - Authentication',
  description: 'Sign in to PRO FLEET - Smart Fleet Management Platform',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Just return children - HTML structure is handled by root layout
  return <>{children}</>;
}
