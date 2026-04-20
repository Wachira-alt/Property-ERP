// @ts-nocheck
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { assertPermission } from "@/lib/permissions"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  location: z.string().optional(),
  description: z.string().optional(),
})

const createUnitTypeSchema = z.object({
  name: z.string().min(1, "Unit type name is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
})

const createUnitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  floor: z.string().optional(),
  unitTypeId: z.string().min(1, "Unit type is required"),
})

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createProject(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "MANAGE_INVENTORY")

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
    description: formData.get("description") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await prisma.project.create({ data: parsed.data })
    revalidatePath("/admin/projects")
    revalidatePath("/inventory")
    return { success: true }
  } catch {
    return { error: "Failed to create project. Please try again." }
  }
}

export async function createUnitType(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "MANAGE_INVENTORY")

  const parsed = createUnitTypeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    projectId: formData.get("projectId"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await prisma.unitType.create({ data: parsed.data })
    revalidatePath("/admin/projects")
    revalidatePath("/inventory")
    return { success: true }
  } catch {
    return { error: "Failed to create unit type. Please try again." }
  }
}

export async function createUnit(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "MANAGE_INVENTORY")

  const parsed = createUnitSchema.safeParse({
    name: formData.get("name"),
    floor: formData.get("floor") || undefined,
    unitTypeId: formData.get("unitTypeId"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await prisma.unit.create({
      data: {
        name: parsed.data.name,
        floor: parsed.data.floor,
        unitTypeId: parsed.data.unitTypeId,
        status: "AVAILABLE",
      },
    })
    revalidatePath("/admin/projects")
    revalidatePath("/inventory")
    return { success: true }
  } catch {
    return { error: "Failed to create unit. Please try again." }
  }
}

export async function updateUnitStatus(
  unitId: string,
  status: "AVAILABLE" | "RESERVED" | "SOLD"
) {
  const session = await requireAuth()
  assertPermission(session.role, "MANAGE_INVENTORY")

  try {
    await prisma.unit.update({
      where: { id: unitId },
      data: { status },
    })
    revalidatePath("/admin/projects")
    revalidatePath("/inventory")
    return { success: true }
  } catch {
    return { error: "Failed to update unit status." }
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getProjects() {
  return prisma.project.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      unitTypes: {
        orderBy: { createdAt: "asc" },
        include: {
          units: {
            orderBy: { name: "asc" },
          },
        },
      },
    },
  })
}

export async function getProjectsBasic() {
  return prisma.project.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
}

export async function getAvailableUnitsByProject(projectId: string) {
  return prisma.unit.findMany({
    where: {
      status: "AVAILABLE",
      unitType: { projectId },
    },
    include: { unitType: true },
    orderBy: { name: "asc" },
  })
}