import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { getUserByEmail, signToken, setSessionCookie, clearSessionCookie } from "@/lib/auth"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// Rate limiting — simple in-memory store
// For production, replace with Upstash Redis
const attempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = attempts.get(ip)

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return false
  }

  if (record.count >= 5) return true

  record.count++
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in 15 minutes." },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data
  const user = await getUserByEmail(email)

  // Constant-time comparison — never reveal which field is wrong
  const passwordMatch = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, "$2b$12$invalidhashfortimingattack000000000000000000000")

  if (!user || !passwordMatch) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    )
  }

  const token = await signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })

  await setSessionCookie(token)

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}

export async function DELETE() {
  await clearSessionCookie()
  return NextResponse.json({ success: true })
}