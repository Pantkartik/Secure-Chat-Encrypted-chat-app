"use client"

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, MessageSquare } from "lucide-react"
import Link from "next/link"
import React, { useEffect, useState } from "react";
import { UserMenu } from "@/components/user-menu";

export default function DashboardPage() {
  const [users, setUsers] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create an AbortController to timeout the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    fetch("http://localhost:3000/api/users", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => {
        clearTimeout(timeoutId);
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        // Silently handle errors during build or when backend is not available
        setError(err.name === 'AbortError' ? 'Request timeout' : err.message);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Cypher Chat</span>
            </div>

            <div className="flex items-center space-x-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Welcome to Cypher Chat</h1>
          <p className="text-lg text-muted-foreground">Start a secure conversation or join an existing chat session</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Host a Chat</CardTitle>
              <CardDescription>
                Create a new secure chat session and invite others with a QR code or token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/session/host">
                <Button className="w-full">Create Session</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-accent/10 to-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Join a Chat</CardTitle>
              <CardDescription>Enter a session token or scan a QR code to join an existing chat</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/session/join">
                <Button variant="outline" className="w-full bg-transparent">
                  Join Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Recent Sessions
              <Badge variant="secondary">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>Your recent chat sessions will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent sessions</p>
              <p className="text-sm">Start your first cypher chat above</p>
            </div>
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Users from Backend:</h2>
              {loading ? (
                <p>Loading users...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <ul className="list-disc list-inside">
                  {users.map((user) => (
                    <li key={user.id}>{user.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}