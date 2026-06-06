// @ts-nocheck
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { verifyToken, SESSION_COOKIE } from "@/lib/jwt"
import type { SessionUser } from "@/types/auth"

export type { SessionUser }

const COMPANY_DOMAIN = "lifestyleestates.co.ke"

export function isCompanyEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${COMPANY_DOMAIN}`)
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token       = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const user = await verifyToken(token)
  if (!user) return null

  // Verify session is still active in database
  const session = await prisma.userSession.findUnique({
    where: { token },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return user
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error("UNAUTHORIZED")
  return session
}

export async function createSession(
  userId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 8)

  // Clean up old sessions for this user (keep last 3)
  const oldSessions = await prisma.userSession.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    skip:    3,
  })

  if (oldSessions.length > 0) {
    await prisma.userSession.deleteMany({
      where: { id: { in: oldSessions.map((s) => s.id) } },
    })
  }

  await prisma.userSession.create({
    data: { userId, token, ipAddress, userAgent, expiresAt },
  })
}

export async function invalidateSession(token: string): Promise<void> {
  await prisma.userSession.deleteMany({ where: { token } })
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.userSession.deleteMany({ where: { userId } })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where:  { email, isActive: true, deletedAt: null },
    select: {
      id:       true,
      name:     true,
      email:    true,
      role:     true,
      password: true,
    },
  })
}

export async function createOtp(userId: string): Promise<string> {
  // Invalidate any existing OTPs for this user
  await prisma.otpCode.updateMany({
    where: { userId, used: false },
    data:  { used: true },
  })

  const code      = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  await prisma.otpCode.create({
    data: { userId, code, expiresAt },
  })

  return code
}

export async function verifyOtp(
  userId: string,
  code: string
): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      userId,
      code,
      used:      false,
      expiresAt: { gt: new Date() },
    },
  })

  if (!otp) return false

  await prisma.otpCode.update({
    where: { id: otp.id },
    data:  { used: true },
  })

  return true
}

export async function logLoginAttempt(data: {
  userId?:   string
  email:     string
  success:   boolean
  ipAddress?: string
  userAgent?: string
  reason?:   string
}): Promise<void> {
  await prisma.loginLog.create({ data })
}