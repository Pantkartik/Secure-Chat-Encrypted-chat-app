"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, RefreshCw, Users, ArrowLeft, CheckCircle, QrCode, Share2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BACKEND_URL } from "@/lib/config"
import { QRCodeCanvas } from "qrcode.react"

export default function HostSessionPage() {
  const router = useRouter()
  const [sessionToken, setSessionToken] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [connectedUsers, setConnectedUsers] = useState(0)

  const generateSession = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      if (!data.sessionId) {
        throw new Error('No sessionId in response')
      }
      
      setSessionToken(data.sessionId)
      // Generate QR code using a proper QR code API
      const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.sessionId)}`
      setQrCodeUrl(qrDataUrl)
    } catch (err) {
      console.error("Failed to create session:", err)
      alert("Failed to create session. Please check if the backend server is running.")
    }
    setIsGenerating(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sessionToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const shareSession = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my SecureChat session",
          text: `Join my encrypted chat session with token: ${sessionToken}`,
          url: `${window.location.origin}/session/join?token=${sessionToken}`,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      copyToClipboard()
    }
  }

  const startChat = () => {
    if (sessionToken) {
      // Get the logged-in user's name from localStorage or use a default
      const userName = localStorage.getItem('userName') || 'Host';
      router.push(`/auth/chat/${sessionToken}?username=${encodeURIComponent(userName)}`)
    }
  }

  // Mock connected users simulation
  useEffect(() => {
    if (sessionToken) {
      const interval = setInterval(() => {
        setConnectedUsers((prev) => {
          const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0
          return Math.max(0, Math.min(5, prev + change))
        })
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [sessionToken])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to dashboard
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Host Session</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Host a Secure Chat</h1>
          <p className="text-lg text-muted-foreground">Create a new encrypted chat session and invite others to join</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Session Setup */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
                <CardDescription>Customize your chat session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionName">Session Name (Optional)</Label>
                  <Input
                    id="sessionName"
                    placeholder="e.g., Team Meeting, Project Discussion"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>

                <Button onClick={generateSession} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating Session...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      {sessionToken ? "Generate New Session" : "Create Session"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {sessionToken && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Session Active
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                      Live
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {connectedUsers === 0
                      ? "Waiting for participants..."
                      : `${connectedUsers} user${connectedUsers === 1 ? "" : "s"} connected`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Session Token</Label>
                    <div className="flex space-x-2">
                      <Input value={sessionToken} readOnly className="font-mono" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyToClipboard}
                        className="shrink-0 bg-transparent"
                      >
                        {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={shareSession} className="flex-1 bg-transparent">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    <Button onClick={startChat} className="flex-1">
                      Start Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* QR Code */}
          <div className="space-y-6">
            {sessionToken ? (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="mr-2 h-5 w-5" />
                    QR Code
                  </CardTitle>
                  <CardDescription>Others can scan this code to join instantly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-white rounded-lg shadow-sm border">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Scan with any QR code reader or the SecureChat app
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <QrCode className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">QR code will appear here after creating a session</p>
                </CardContent>
              </Card>
            )}

            {sessionToken && (
              <div className="flex flex-col items-center mt-8">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                <p className="mt-2 text-sm text-muted-foreground">Scan this QR code to join the session</p>
              </div>
            )}
            {sessionToken && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Share the session token or QR code with participants. The session will remain active until you close it.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}