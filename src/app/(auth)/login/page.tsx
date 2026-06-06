// @ts-nocheck
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, Shield } from "lucide-react"

type Step = "credentials" | "otp"

export default function LoginPage() {
  const router          = useRouter()
  const [step, setStep] = useState<Step>("credentials")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId]   = useState("")
  const [email, setEmail]     = useState("")
  const [otp, setOtp]         = useState("")

  // ── Step 1: Submit email + password ────────────────────────────────────────
  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form     = new FormData(e.currentTarget)
    const email    = form.get("email") as string
    const password = form.get("password") as string

    try {
      const res  = await fetch("/api/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Login failed")
        return
      }

      // Move to OTP step
      setUserId(data.userId)
      setEmail(email)
      setStep("otp")
      toast.success(data.message)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Submit OTP ────────────────────────────────────────────────────
  async function handleOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const res  = await fetch("/api/auth", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, code: otp }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Verification failed")
        return
      }

      router.push("/contacts")
      router.refresh()
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="w-full max-w-sm px-4">

        {/* Logo + brand */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <Image
            src="/company_lo.png"
            alt="Home Bridge"
            width={72}
            height={72}
            className="rounded-xl object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[#e6edf3]">Home Bridge</h1>
            <p className="text-sm text-[#7d8590] mt-0.5">
              {step === "credentials"
                ? "Sign in to your account"
                : "Enter verification code"}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">

          {/* ── Credentials step ─────────────────────────────────────────── */}
          {step === "credentials" && (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-[#e6edf3]"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@lifestyleestates.co.ke"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb] h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium text-[#e6edf3]"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb] h-9 text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-9 text-sm font-medium bg-[#238636] hover:bg-[#2ea043] border border-[#2ea04333] text-white disabled:opacity-60 mt-2"
              >
                {loading ? "Verifying…" : "Continue"}
              </Button>
            </form>
          )}

          {/* ── OTP step ─────────────────────────────────────────────────── */}
          {step === "otp" && (
            <form onSubmit={handleOtp} className="space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[#1f6feb1a] border border-[#1f6feb33] rounded-lg">
                <Shield size={14} className="text-[#58a6ff] shrink-0 mt-0.5" />
                <p className="text-xs text-[#58a6ff] leading-relaxed">
                  A 6-digit code was sent to{" "}
                  <span className="font-medium">{email}</span>.
                  It expires in 10 minutes.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="otp"
                  className="text-xs font-medium text-[#e6edf3]"
                >
                  Verification code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb] h-12 text-2xl text-center font-mono tracking-[0.5em]"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-9 text-sm font-medium bg-[#238636] hover:bg-[#2ea043] border border-[#2ea04333] text-white disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Sign in"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("credentials")
                  setOtp("")
                  setUserId("")
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-[#7d8590] hover:text-[#e6edf3] transition-colors mt-1"
              >
                <ArrowLeft size={12} />
                Back to sign in
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-[#484f58] mt-6">
          Home Bridge ERP · Internal use only
        </p>
      </div>
    </div>
  )
}