'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import { Spinner } from "@/components/ui/spinner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import LoginBg from '@/app/api/placeholder/1200x800/img.jpg'

export function LoginForm({ className, ...props }) {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push("/Dashboard")
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (signupError) throw new Error(signupError.message)
      if (!authData?.user) throw new Error("Signup failed. Please try again.")

      let avatarUrl = ""
      if (avatar && avatar.length > 0) {
        const file = avatar[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${authData.user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`

        // Fix: Remove 'avatars/' from the filePath
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true, // prevent collision errors
          contentType: file.type, // ensure proper MIME
        })

        if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`)

        const { data: urlData } = await supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        if (!urlData) throw new Error("Failed to get public URL for the avatar.")

        avatarUrl = urlData.publicUrl
      }

      const response = await fetch('/api/create-user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_id: authData.user.id,
          email,
          name,
          avatar: avatarUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Server error: ${response.status}`)
      }

      const userData = await response.json()
      if (userData && userData.error) {
        throw new Error(`Failed to save user data: ${userData.error.message || 'Unknown error'}`)
      }

      if (authData.user && !authData.user.confirmed_at) {
        setShowConfirmationDialog(true)
      } else {
        router.push("/Dashboard")
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmationClose = () => {
    setShowConfirmationDialog(false)
    setEmail("")
    setPassword("")
    setName("")
    setAvatar(null)
    setIsSignup(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <AnimatePresence mode="wait">
            {isSignup ? (
              <motion.div
                key="signup-bg"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.2 }}
                className="bg-muted relative hidden md:block order-1"
              >
                <Image
                  fill
                  alt="Signup background"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                  src={LoginBg}
                />
              </motion.div>
            ) : (
              <motion.div
                key="login-bg"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 0}}
                transition={{ duration: 0.4 }}
                className="bg-muted relative hidden md:block order-2"
              >
                <Image
                  fill
                  alt="Login background"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                  src={LoginBg}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            key={isSignup ? "signup-form" : "login-form"}
            initial={{ opacity: 0, x: isSignup ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignup ? -50 : 50 }}
            transition={{ duration: 0.1 }}
            className={cn("p-6 md:p-8", isSignup ? "order-2" : "order-1")}
            onSubmit={isSignup ? handleSignup : handleLogin}
          >
            <div className="flex flex-col gap-6">
              <motion.div layout className="flex flex-col items-center text-center">
                <motion.h1 layout className="text-2xl font-bold">
                  {isSignup ? "Create an Account" : "Welcome back"}
                </motion.h1>
                <motion.p layout className="text-muted-foreground text-balance">
                  {isSignup
                    ? "Sign up for your Acme Inc account"
                    : "Login to your Acme Inc account"}
                </motion.p>
              </motion.div>

              {isSignup && (
                <motion.div layout className="grid gap-3">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </motion.div>
              )}

              <motion.div layout className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </motion.div>

              <motion.div layout className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </motion.div>

              {isSignup && (
                <motion.div layout className="grid gap-3">
                  <Label htmlFor="avatar">Avatar (Optional)</Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => setAvatar(e.target.files)}
                  />
                </motion.div>
              )}

              {error && (
                <motion.p layout className="text-red-500 text-sm text-center">
                  {error}
                </motion.p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Spinner className="text-blue-50" />
                ) : isSignup ? (
                  "Sign Up"
                ) : (
                  "Login"
                )}
              </Button>

              <motion.div layout className="text-center text-sm">
                {isSignup ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(false)}
                      className="underline underline-offset-4"
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(true)}
                      className="underline underline-offset-4"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          </motion.form>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our <Link href="#">Terms of Service</Link> and{" "}
        <Link href="#">Privacy Policy</Link>.
      </div>

      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check your email</AlertDialogTitle>
            <AlertDialogDescription>
              We've sent a confirmation email to <strong>{email}</strong>.
              Please check your inbox and click the verification link to activate your account.
              You'll need to verify your email before you can log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmationClose}>
              Back to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
