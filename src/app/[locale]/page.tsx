import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'


interface LocalePageProps {
  params: {
    locale: string
  }
}

export default async function LocalePage({ params }: LocalePageProps) {
  const session = await getServerSession(authOptions)
  const { locale } = params

  if (session?.user) {
    const role = session.user.role
    let destination = `/${locale}/auth/signin` // Default destination

    switch (role) {
      case 'ADMIN':
        destination = `/${locale}/admin`
        break
      case 'DRIVER':
        destination = `/${locale}/driver`
        break
      case 'CUSTOMER':
        destination = `/${locale}/customer`
        break
      case 'ACCOUNTANT':
        destination = `/${locale}/accountant`
        break
      case 'CUSTOMS_BROKER':
        destination = `/${locale}/customs-broker`
        break
    }
    return redirect(destination)
  }

  // If no session, redirect to signin page with locale
  return redirect(`/${locale}/auth/signin`)
}
