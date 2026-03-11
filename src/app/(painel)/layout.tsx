import { PainelLayout } from '@/components/layout/painel-layout'

export default function PainelRootLayout({ children }: { children: React.ReactNode }) {
  return <PainelLayout>{children}</PainelLayout>
}
