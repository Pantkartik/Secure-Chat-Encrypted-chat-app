"use client"

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, ArrowLeft, Users, QrCode, KeyRound, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"


export default function JoinSessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [sessionToken, setSessionToken] = useState(searchParams?.get("token") || "")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [scanResult, setScanResult] = useState("")
  const [activeTab, setActiveTab] = useState("token")
  const [username, setUsername] = useState("");

  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);

        // Mock QR code scanning
        setTimeout(() => {
          const mockToken = Math.random().toString(36).substring(2, 10).toUpperCase();
          console.log("[DEBUG] Mock QR scan result:", mockToken);
          setScanResult(mockToken);
          setSessionToken(mockToken);
          setActiveTab("token");
          stopCamera();
        }, 3000);
      }
    } catch (err) {
      setCameraError("Unable to access camera. Please check permissions.");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const joinSession = async () => {
    if (!sessionToken.trim() || !username.trim()) {
      setError("Please enter a session token and username");
      return;
    }
    
    // Validate session token format (should be 8 characters, alphanumeric)
    const tokenFormat = /^[A-Z0-9]{8}$/;
    if (!tokenFormat.test(sessionToken.trim().toUpperCase())) {
      setError("Invalid session token format. Please use an 8-character code (e.g., ABC12345)");
      console.log(`[DEBUG] Invalid token format: "${sessionToken.trim()}" (expected 8 alphanumeric characters)`);
      return;
    }
    
    setIsJoining(true);
    setError("");
    try {
      const trimmedToken = sessionToken.trim().toUpperCase();
      console.log("[DEBUG] Joining session with token:", trimmedToken);
      
      // Retry mechanism with 3 attempts and 1-second delay
      let attempt = 0;
      const maxAttempts = 3;
      let res: Response | null = null;
      let data: any = null;
      
      while (attempt < maxAttempts) {
        attempt++;
        console.log(`[DEBUG] Attempt ${attempt} of ${maxAttempts}`);
        
        try {
          res = await fetch("http://localhost:3001/api/session/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: trimmedToken, username: username.trim() }),
          });
          
          data = await res.json();
          console.log(`[DEBUG] Backend response (attempt ${attempt}):`, data);
          
          if (res.ok && data.success) {
            break; // Success, exit retry loop
          }
        } catch (fetchError) {
          console.error(`[DEBUG] Fetch attempt ${attempt} failed:`, fetchError);
          if (attempt === maxAttempts) {
            throw fetchError; // Re-throw on final attempt
          }
        }
        
        if (attempt < maxAttempts) {
          console.log(`[DEBUG] Retrying in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (res && res.ok && data && data.success) {
        router.push(`/auth/chat/${trimmedToken}?username=${encodeURIComponent(username)}`);
      } else {
        setError(data?.error || "Session not found. Please check the token and try again. Expected format: 8 characters (e.g., ABC12345)");
      }
    } catch (err) {
      console.error("[DEBUG] Join error:", err);
      setError("Failed to join session. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera() // Cleanup camera on unmount
    }
  }, [])

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
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Join Session</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Join a Secure Chat</h1>
          <p className="text-lg text-muted-foreground">Enter a session token or scan a QR code to join</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Join Session</CardTitle>
            <CardDescription>Choose how you'd like to join the chat session</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="token" className="flex items-center">
                  <KeyRound className="w-4 h-4 mr-2" />
                  Enter Token
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center">
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="token" className="space-y-4 mt-6">
                {scanResult && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>QR code scanned successfully! Token: {scanResult}</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="token">Session Token</Label>
                  <Input
                    id="token"
                    placeholder="Enter 8-character session token (e.g., ABC12345)"
                    value={sessionToken}
                    onChange={(e) => setSessionToken(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">Get this 8-character token from the session host</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <Button onClick={joinSession} disabled={isJoining || !sessionToken.trim()} className="w-full">
                  {isJoining ? "Joining..." : "Join Session"}
                </Button>
              </TabsContent>

              <TabsContent value="qr" className="space-y-4 mt-6">
                {cameraError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{cameraError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-square max-w-sm mx-auto">
                    {cameraActive ? (
                      <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Scanning overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-accent rounded-lg relative">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-accent rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-accent rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-accent rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-accent rounded-br-lg"></div>

                            {/* Scanning line animation */}
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-accent animate-pulse"></div>
                          </div>
                        </div>

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                            <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse" />
                            Scanning for QR code...
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white">
                        <Camera className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-sm opacity-75">Camera preview will appear here</p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {!cameraActive ? (
                      <Button onClick={startCamera} className="flex-1">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
                        <CameraOff className="mr-2 h-4 w-4" />
                        Stop Camera
                      </Button>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Point your camera at the QR code shared by the session host
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have a session token? Ask the host to share one with you.
          </p>
        </div>
      </div>
    </div>
  )
}