import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import InstallPrompt from "@/components/install-prompt"
import AndroidInstallPrompt from "@/components/android-install-prompt"
import ManualInstallPrompt from "@/components/manual-install-prompt"
import PWAInstaller from "@/components/pwa-installer"
import "./globals.css"
import "./mobile.css"

export const metadata: Metadata = {
  title: "Cypher Chat - Cypher Encrypted Messaging",
  description: "Cypher encrypted messaging with video calls, QR code sharing, and modern design. Built with security and privacy in mind.",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cypher Chat",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Cypher Chat",
    title: "Cypher Chat - Cypher Encrypted Messaging",
    description: "Cypher encrypted messaging with video calls, QR code sharing, and modern design. Built with security and privacy in mind.",
  },
  twitter: {
    card: "summary",
    title: "Cypher Chat - Cypher Encrypted Messaging",
    description: "Cypher encrypted messaging with video calls, QR code sharing, and modern design. Built with security and privacy in mind.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Cypher Chat" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cypher Chat" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </Suspense>
        <Analytics />
        <InstallPrompt />
        <AndroidInstallPrompt />
        <ManualInstallPrompt />
        <PWAInstaller />
      </body>
    </html>
  )
}