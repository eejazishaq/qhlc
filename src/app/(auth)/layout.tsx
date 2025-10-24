import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <PublicHeader />
      <main className="flex-1 flex flex-col py-8">{children}</main>
      <PublicFooter />
    </div>
  )
}
