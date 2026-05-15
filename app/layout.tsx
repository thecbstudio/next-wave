import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TrendPulse — Viral Trend Intelligence",
  description:
    "AI-powered prediction of viral food, student lifestyle, and youth internet trends before they go mainstream.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full overflow-hidden bg-[hsl(var(--background))] font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
