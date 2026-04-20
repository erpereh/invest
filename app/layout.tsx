import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Invest - Seguimiento de fondos indexados',
  description: 'Dashboard privado de seguimiento de fondos indexados por ISIN',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
