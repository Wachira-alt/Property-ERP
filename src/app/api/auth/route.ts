// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import {
  getUserByEmail,
  createOtp,
  verifyOtp,
  createSession,
  invalidateSession,
  isCompanyEmail,
  logLoginAttempt,
} from "@/lib/auth"
import { signToken, SESSION_COOKIE, EXPIRY_SECONDS } from "@/lib/jwt"
import { sendEmail } from "@/lib/mailer"

const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

const otpSchema = z.object({
  userId: z.string().min(1),
  code:   z.string().length(6, "OTP must be 6 digits"),
})

// ── In-memory rate limiter ────────────────────────────────────────────────────
// const attempts = new Map<string, { count: number; resetAt: number }>()

// function isRateLimited(ip: string): boolean {
//   const now    = Date.now()
//   const record = attempts.get(ip)
//   if (!record || now > record.resetAt) {
//     attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
//     return false
//   }
//   if (record.count >= 5) return true
//   record.count++
//   return false
// }

// ── Step 1: Password verification → send OTP ──────────────────────────────────
export async function POST(req: NextRequest) {
  const ip        = req.headers.get("x-forwarded-for") ?? "unknown"
  const userAgent = req.headers.get("user-agent") ?? "unknown"

  // if (isRateLimited(ip)) {
  //   return NextResponse.json(
  //     { error: "Too many login attempts. Try again in 15 minutes." },
  //     { status: 429 }
  //   )
  // }

  const body   = await req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  // ── Domain restriction ────────────────────────────────────────────────────
  if (!isCompanyEmail(email)) {
    await logLoginAttempt({
      email,
      success:   false,
      ipAddress: ip,
      userAgent,
      reason:    "Invalid email domain",
    })
    return NextResponse.json(
      { error: "Access restricted to company email addresses only." },
      { status: 403 }
    )
  }

  const user = await getUserByEmail(email)

  const passwordMatch = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, "$2b$12$invalidhashfortimingattack000000000000000000000")

  if (!user || !passwordMatch) {
    await logLoginAttempt({
      userId:    user?.id,
      email,
      success:   false,
      ipAddress: ip,
      userAgent,
      reason:    "Invalid credentials",
    })
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    )
  }

  // ── Generate and send OTP ─────────────────────────────────────────────────
  const code = await createOtp(user.id)

  try {
    await sendEmail({
      to:      user.email,
      subject: "Your login verification code",
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1f6feb; margin-bottom: 8px;">Verification code</h2>
          <p style="color: #555; margin-bottom: 24px;">
            Use this code to complete your sign in to Home Bridge ERP.
            It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0d1117; font-family: monospace;">
              ${code}
            </span>
          </div>
          <p style="color: #888; font-size: 13px;">
            If you did not request this code, someone may be trying to access your account.
            Please contact your system administrator immediately.
          </p>
          <p style="color: #aaa; font-size: 11px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
            Home Bridge Ltd. · Internal ERP System
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error("[auth/otp] Failed to send email:", err)
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    requiresOtp: true,
    userId:      user.id,
    message:     `Verification code sent to ${email}`,
  })
}

// ── Step 2: OTP verification → issue session ──────────────────────────────────
export async function PUT(req: NextRequest) {
  const ip        = req.headers.get("x-forwarded-for") ?? "unknown"
  const userAgent = req.headers.get("user-agent") ?? "unknown"

  const body   = await req.json().catch(() => null)
  const parsed = otpSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { userId, code } = parsed.data

  const valid = await verifyOtp(userId, code)

  if (!valid) {
    await logLoginAttempt({
      userId,
      email:     "",
      success:   false,
      ipAddress: ip,
      userAgent,
      reason:    "Invalid or expired OTP",
    })
    return NextResponse.json(
      { error: "Invalid or expired code. Please try again." },
      { status: 401 }
    )
  }

  // Load user
  const user = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, name: true, email: true, role: true },
    })
  )

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const token = await signToken({
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  })

  // Store session in database
  await createSession(user.id, token, ip, userAgent)

  // Log successful login
  await logLoginAttempt({
    userId:    user.id,
    email:     user.email,
    success:   true,
    ipAddress: ip,
    userAgent,
  })

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   EXPIRY_SECONDS,
    path:     "/",
  })

  return response
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const cookieStore = req.cookies
  const token       = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await invalidateSession(token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}