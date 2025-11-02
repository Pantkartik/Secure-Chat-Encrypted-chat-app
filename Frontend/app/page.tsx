"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Shield, Zap, Users, Lock, QrCode, MessageSquare, Moon, Sun, CheckCircle, Star, TrendingUp } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function LandingPage() {
  const { theme, setTheme } = useTheme()
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    
    // Trigger animations on mount
    setIsVisible(true)
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description: "Military-grade encryption ensures your conversations stay private and secure.",
      color: "text-accent",
      gradient: "from-accent/20 to-accent/10",
      stats: "99.9% Secure",
    },
    {
      icon: QrCode,
      title: "QR Code Sharing",
      description: "Share chat sessions instantly with secure QR codes. No complex setup required.",
      color: "text-primary",
      gradient: "from-primary/20 to-primary/10",
      stats: "Instant Setup",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Real-time messaging with smooth animations and instant delivery.",
      color: "text-secondary",
      gradient: "from-secondary/20 to-secondary/10",
      stats: "< 100ms Latency",
    },
    {
      icon: Users,
      title: "Host & Join",
      description: "Create secure chat rooms or join existing ones with a simple token.",
      color: "text-accent",
      gradient: "from-accent/20 to-accent/10",
      stats: "Unlimited Rooms",
    },
  ]

  const stats = [
    { number: "50K+", label: "Active Users", icon: TrendingUp },
    { number: "1M+", label: "Messages Sent", icon: MessageSquare },
    { number: "4.9★", label: "User Rating", icon: Star },
    { number: "24/7", label: "Support", icon: CheckCircle },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Navigation */}
      <nav className={`border-b border-border/40 backdrop-blur-sm bg-background/95 sticky top-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'shadow-lg shadow-primary/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-accent to-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="relative">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Cypher Chat
                </span>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
              </div>
            </Link>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-accent/10 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Link href="/auth/login">
                <Button variant="ghost" className="hover:bg-accent/10 group relative overflow-hidden">
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="secondary" className="mb-6 bg-gradient-to-r from-accent/20 to-primary/20 text-accent border-accent/30 backdrop-blur-sm animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              Now with QR Code Sharing
            </Badge>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-balance mb-6">
              <span className="text-foreground animate-fade-in">Secure Messaging</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Made Simple
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty leading-relaxed animate-fade-in-delay">
              Experience the future of private communication with end-to-end encryption, instant QR code sharing, and a
              beautiful interface that just works.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden px-8 py-6 text-lg">
                  <span className="relative z-10 flex items-center">
                    Start Chatting Now
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-border hover:bg-accent/5 bg-transparent backdrop-blur-sm px-8 py-6 text-lg group">
                  <MessageSquare className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-secondary/20 via-accent/10 to-primary/20 rounded-full blur-3xl animate-float-delay" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,211,102,0.05)_0%,transparent_70%)]"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,211,102,0.02)_0%,transparent_70%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-card/30 via-background to-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
              Everything you need for cypher communication
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
              Built with modern security standards and designed for seamless user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-accent/10 border-border/30 hover:border-accent/40 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardContent className="p-6 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 transition-all duration-300 ${hoveredFeature === index ? "scale-110 rotate-3" : ""} shadow-lg`}>
                      <feature.icon className={`w-7 h-7 ${feature.color} transition-transform duration-300 ${hoveredFeature === index ? "scale-110" : ""}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-xs font-medium text-accent group-hover:text-primary transition-colors duration-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {feature.stats}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,211,102,0.03)_0%,transparent_70%)]"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Card className="border-border/30 bg-gradient-to-br from-card/90 to-background/90 backdrop-blur-xl shadow-2xl shadow-primary/10">
            <CardContent className="p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
              <div className="relative z-10">
                <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30">
                  Get Started Today
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
                  Ready to cypher your conversations?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 text-pretty leading-relaxed">
                  Join thousands of users who trust Cypher Chat for their private communications.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/signup">
                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden px-8 py-6 text-lg">
                      <span className="relative z-10 flex items-center">
                        Create Free Account
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline" className="border-border hover:bg-accent/5 bg-transparent backdrop-blur-sm px-8 py-6 text-lg group">
                      <span className="relative z-10">Sign In</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-16 bg-gradient-to-br from-card/20 via-background to-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="flex flex-col items-start space-y-4">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-accent to-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="relative">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Cypher Chat
                  </span>
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full"></div>
                </div>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Premium encrypted messaging with modern design and unparalleled security.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <h4 className="font-semibold text-foreground mb-2">Features</h4>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">End-to-End Encryption</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">QR Code Sharing</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Real-time Messaging</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Video Calls</Link>
            </div>
            <div className="flex flex-col space-y-2">
              <h4 className="font-semibold text-foreground mb-2">Support</h4>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Help Center</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Contact Us</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Privacy Policy</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Terms of Service</Link>
            </div>
          </div>
          <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2025 Cypher Chat. Built with security and privacy in mind.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">End-to-End Encrypted</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}