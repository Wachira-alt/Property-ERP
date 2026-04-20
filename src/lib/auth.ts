// @ts-nocheck
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { verifyToken, SESSION_COOKIE } from "@/lib/jwt"
import type { SessionUser } from "@/types/auth"

export type { SessionUser }

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error("UNAUTHORIZED")
  return session
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email, isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      password: true,
    },
  })
}