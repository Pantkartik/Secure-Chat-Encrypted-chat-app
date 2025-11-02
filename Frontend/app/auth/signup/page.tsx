"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, Lock, Mail, User, Github, Chrome, Check, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    strength = Object.values(checks).filter(Boolean).length
    return { strength: (strength / 5) * 100, checks }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const getStrengthColor = (strength: number) => {
    if (strength < 40) return "bg-destructive"
    if (strength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = (strength: number) => {
    if (strength < 40) return "Weak"
    if (strength < 80) return "Medium"
    return "Strong"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (passwordStrength.strength < 60) {
      setError("Please choose a stronger password")
      setIsLoading(false)
      return
    }

    // Mock registration
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      // Store user name in localStorage for use in chat sessions
      localStorage.setItem('userName', formData.name);
      router.push("/dashboard")
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignup = async (provider: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // Store user name in localStorage for use in chat sessions
    localStorage.setItem('userName', provider === 'google' ? 'Google User' : 'GitHub User');
    router.push("/dashboard")
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Sign up to get started with secure messaging
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Password strength</span>
                    <span className={passwordStrength.strength < 40 ? "text-destructive" : passwordStrength.strength < 80 ? "text-yellow-500" : "text-green-500"}>
                      {getStrengthText(passwordStrength.strength)}
                    </span>
                  </div>
                  <Progress value={passwordStrength.strength} className="h-2" />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      {passwordStrength.checks.length ? (
                        <Check className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <X className="mr-1 h-3 w-3 text-destructive" />
                      )}
                      8+ characters
                    </div>
                    <div className="flex items-center">
                      {passwordStrength.checks.lowercase ? (
                        <Check className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <X className="mr-1 h-3 w-3 text-destructive" />
                      )}
                      Lowercase
                    </div>
                    <div className="flex items-center">
                      {passwordStrength.checks.uppercase ? (
                        <Check className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <X className="mr-1 h-3 w-3 text-destructive" />
                      )}
                      Uppercase
                    </div>
                    <div className="flex items-center">
                      {passwordStrength.checks.number ? (
                        <Check className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <X className="mr-1 h-3 w-3 text-destructive" />
                      )}
                      Number
                    </div>
                    <div className="flex items-center col-span-2">
                      {passwordStrength.checks.special ? (
                        <Check className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <X className="mr-1 h-3 w-3 text-destructive" />
                      )}
                      Special character
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="text-xs">
                  {formData.password === formData.confirmPassword ? (
                    <div className="text-green-500 flex items-center">
                      <Check className="mr-1 h-3 w-3" />
                      Passwords match
                    </div>
                  ) : (
                    <div className="text-destructive flex items-center">
                      <X className="mr-1 h-3 w-3" />
                      Passwords do not match
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => handleSocialSignup("google")} disabled={isLoading}>
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" onClick={() => handleSocialSignup("github")} disabled={isLoading}>
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}