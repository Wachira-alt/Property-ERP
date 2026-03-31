"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Login failed")
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
            src="/company_logo.png"
            alt="Lifestyle"
            width={72}
            height={72}
            className="rounded-xl object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[#e6edf3]">Lifestyle</h1>
            <p className="text-sm text-[#7d8590] mt-0.5">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="you@lifestyle.co.ke"
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
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#484f58] mt-6">
          Lifestyle Property ERP · Internal use only
        </p>
      </div>
    </div>
  )
}