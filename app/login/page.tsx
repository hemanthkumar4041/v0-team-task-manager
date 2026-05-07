"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Loader2, Eye, EyeOff, Shield, Users } from "lucide-react"

type DemoUser = {
  id: string
  email: string
  password: string
  full_name: string
  role: string
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchDemoUsers() {
      const { data } = await supabase.from("demo_users").select("*")
      if (data) setDemoUsers(data)
    }
    fetchDemoUsers()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  const handleDemoLogin = async (demoUser: DemoUser) => {
    setLoading(true)
    setError("")
    setEmail(demoUser.email)
    setPassword(demoUser.password)

    // First try to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: demoUser.email,
      password: demoUser.password,
    })

    if (signInError) {
      // If user doesn't exist, create them
      const { error: signUpError } = await supabase.auth.signUp({
        email: demoUser.email,
        password: demoUser.password,
        options: {
          data: {
            full_name: demoUser.full_name,
            role: demoUser.role,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // Try signing in again after signup
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: demoUser.email,
        password: demoUser.password,
      })

      if (retryError) {
        setError("Demo account created. Please check email or try again.")
        setLoading(false)
        return
      }
    }

    router.push("/dashboard")
    router.refresh()
  }

  const teamLeads = demoUsers.filter(u => u.role === "admin")
  const members = demoUsers.filter(u => u.role === "member")

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        {/* Login Form */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Team Task Manager</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Users Quick Login */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Quick Demo Login</CardTitle>
            <CardDescription>Click any account below to login instantly for assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Leads */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Shield className="h-4 w-4" />
                Team Leads (Admin Access)
              </div>
              <div className="grid gap-2">
                {teamLeads.map((user) => (
                  <Button
                    key={user.id}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleDemoLogin(user)}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-xs text-muted-foreground">{user.email} / {user.password}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Members */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Users className="h-4 w-4" />
                Team Members
              </div>
              <div className="grid gap-2">
                {members.map((user) => (
                  <Button
                    key={user.id}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleDemoLogin(user)}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-xs text-muted-foreground">{user.email} / {user.password}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
