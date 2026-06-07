// @ts-nocheck
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { assertPermission } from "@/lib/permissions"
import { isCompanyEmail } from "@/lib/auth"
import { audit } from "@/lib/audit"
import bcrypt from "bcryptjs"

const COMPANY_DOMAIN = "lifestyleestates.co.ke"

const createUserSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role:     z.enum(["ADMIN", "SALES", "ACCOUNTANT", "HR", "GENERAL_MANAGER"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
})

const updateUserSchema = z.object({
  userId: z.string().min(1),
  name:   z.string().min(2, "Name must be at least 2 characters"),
  role:   z.enum(["ADMIN", "SALES", "ACCOUNTANT", "HR", "GENERAL_MANAGER"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
})

const resetPasswordSchema = z.object({
  userId:   z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function createUser(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "MANAGE_TEAM")

  const parsed = createUserSchema.safeParse({
    name:     formData.get("name"),
    email:    formData.get("email"),
    password: formData.get("password"),
    role:     formData.get("role"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, email, password, role } = parsed.data

  if (!isCompanyEmail(email)) {
    return { error: `Only @${COMPANY_DOMAIN} email addresses are allowed.` }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { error: "A user with this email already exists." }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    })

    await audit({
      action:     "USER_CREATED",
      entityType: "USER",
      entityId:   user.id,
      actor:      session,
      metadata:   { name, email, role },
    })

    revalidatePath("/admin/team")
    return { success: true }
  } catch {
    return { error: "Failed to create user. Please try again." }
  }
}

export async function updateUser(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "MANAGE_TEAM")

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    name:   formData.get("name"),
    role:   formData.get("role"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { userId, name, role } = parsed.data

  try {
    if (role !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true, deletedAt: null },
      })
      const targetUser = await prisma.user.findUnique({ where: { id: userId } })
      if (adminCount === 1 && targetUser?.role === "ADMIN") {
        return { error: "Cannot change role — this is the last admin account." }
      }
    }

    const before = await prisma.user.findUnique({
      where:  { id: userId },
      select: { name: true, role: true },
    })

    await prisma.user.update({ where: { id: userId }, data: { name, role } })

    await audit({
      action:     "USER_UPDATED",
      entityType: "USER",
      entityId:   userId,
      actor:      session,
      metadata: {
        before: { name: before?.name, role: before?.role },
        after:  { name, role },
      },
    })

    revalidatePath("/admin/team")
    return { success: true }
  } catch {
    return { error: "Failed to update user." }
  }
}

export async function deactivateUser(userId: string) {
  const session = await requireAuth()
  assertPermission(session.role, "MANAGE_TEAM")

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })

    if (targetUser?.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true, deletedAt: null },
      })
      if (adminCount === 1) {
        return { error: "Cannot deactivate the last admin account." }
      }
    }

    if (userId === session.id) {
      return { error: "You cannot deactivate your own account." }
    }

    await import("@/lib/auth").then(({ invalidateAllUserSessions }) =>
      invalidateAllUserSessions(userId)
    )

    await prisma.user.update({
      where: { id: userId },
      data:  { isActive: false, deletedAt: new Date() },
    })

    await audit({
      action:     "USER_DEACTIVATED",
      entityType: "USER",
      entityId:   userId,
      actor:      session,
      metadata: {
        targetName:  targetUser?.name,
        targetEmail: targetUser?.email,
        targetRole:  targetUser?.role,
      },
    })

    revalidatePath("/admin/team")
    return { success: true }
  } catch {
    return { error: "Failed to deactivate user." }
  }
}

export async function resetPassword(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "MANAGE_TEAM")

  const parsed = resetPasswordSchema.safeParse({
    userId:   formData.get("userId"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { userId, password } = parsed.data

  try {
    const hashed = await bcrypt.hash(password, 12)

    await import("@/lib/auth").then(({ invalidateAllUserSessions }) =>
      invalidateAllUserSessions(userId)
    )

    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

    await audit({
      action:     "USER_PASSWORD_RESET",
      entityType: "USER",
      entityId:   userId,
      actor:      session,
      metadata:   { resetById: session.id },
    })

    revalidatePath("/admin/team")
    return { success: true }
  } catch {
    return { error: "Failed to reset password." }
  }
}

export async function getTeamMembers() {
  return prisma.user.findMany({
    where:   { deletedAt: null },
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      isActive:  true,
      createdAt: true,
      _count:    { select: { assignedContacts: true } },
    },
    orderBy: { createdAt: "asc" },
  })
}