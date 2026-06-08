// @ts-nocheck
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { assertPermission } from "@/lib/permissions"
import { audit } from "@/lib/audit"

const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  phone:     z.string().min(10, "Enter a valid phone number"),
  email:     z.string().email("Enter a valid email").optional().or(z.literal("")),
  projectId: z.string().min(1, "Project is required"),
  agentId:   z.string().min(1, "Agent is required"),
  unitId:    z.string().optional(),
})

const assignUnitSchema = z.object({
  contactId: z.string().min(1),
  unitId:    z.string().min(1, "Please select a unit"),
})

const addNoteSchema = z.object({
  contactId: z.string().min(1),
  content:   z.string().min(1, "Note cannot be empty"),
})

export async function createContact(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "CREATE_CONTACT")

  const parsed = createContactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName:  formData.get("lastName"),
    phone:     formData.get("phone"),
    email:     formData.get("email") || undefined,
    projectId: formData.get("projectId"),
    agentId:   formData.get("agentId"),
    unitId:    formData.get("unitId") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (parsed.data.unitId) {
    const unit = await prisma.unit.findUnique({
      where: { id: parsed.data.unitId },
    })
    if (!unit || unit.status !== "AVAILABLE") {
      return { error: "Selected unit is no longer available." }
    }
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        firstName: parsed.data.firstName,
        lastName:  parsed.data.lastName,
        phone:     parsed.data.phone,
        email:     parsed.data.email || null,
        projectId: parsed.data.projectId,
        agentId:   parsed.data.agentId,
        opportunity: {
          create: {
            stage: "GREEN",
            ...(parsed.data.unitId && {
              unit: { connect: { id: parsed.data.unitId } },
            }),
          },
        },
      },
    })

    await audit({
      action:     "CONTACT_CREATED",
      entityType: "CONTACT",
      entityId:   contact.id,
      actor:      session,
      metadata: {
        name:      `${parsed.data.firstName} ${parsed.data.lastName}`,
        phone:     parsed.data.phone,
        email:     parsed.data.email,
        projectId: parsed.data.projectId,
        agentId:   parsed.data.agentId,
        unitId:    parsed.data.unitId,
      },
    })

    revalidatePath("/contacts")
    return { success: true, contactId: contact.id }
  } catch {
    return { error: "Failed to create contact. Please try again." }
  }
}

export async function assignUnit(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "CREATE_CONTACT")

  const parsed = assignUnitSchema.safeParse({
    contactId: formData.get("contactId"),
    unitId:    formData.get("unitId"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { contactId, unitId } = parsed.data

  try {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } })

    if (!unit || unit.status !== "AVAILABLE") {
      return { error: "This unit is no longer available." }
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { contactId },
    })

    if (!opportunity) {
      return { error: "No opportunity found for this contact." }
    }

    const previousUnitId = opportunity.unitId

    await prisma.opportunity.update({
      where: { contactId },
      data:  { unitId },
    })

    await audit({
      action:     "UNIT_ASSIGNED",
      entityType: "CONTACT",
      entityId:   contactId,
      actor:      session,
      metadata: {
        unitId,
        unitName:        unit.name,
        previousUnitId,
      },
    })

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to assign unit. Please try again." }
  }
}

export async function addNote(formData: FormData) {
  const session = await requireAuth()

  const parsed = addNoteSchema.safeParse({
    contactId: formData.get("contactId"),
    content:   formData.get("content"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const note = await prisma.note.create({
      data: {
        contactId: parsed.data.contactId,
        authorId:  session.id,
        content:   parsed.data.content,
      },
    })

    await audit({
      action:     "NOTE_ADDED",
      entityType: "CONTACT",
      entityId:   parsed.data.contactId,
      actor:      session,
      metadata: {
        noteId:  note.id,
        preview: parsed.data.content.slice(0, 100),
      },
    })

    revalidatePath(`/contacts/${parsed.data.contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to add note." }
  }
}

export async function getContacts(search?: string, stage?: string) {
  return prisma.contact.findMany({
    where: {
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName:  { contains: search, mode: "insensitive" } },
          { phone:     { contains: search, mode: "insensitive" } },
          { email:     { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(stage && stage !== "ALL" && {
        opportunity: { stage: stage as any },
      }),
    },
    include: {
      project:     { select: { id: true, name: true } },
      agent:       { select: { id: true, name: true } },
      opportunity: {
        select: {
          id:    true,
          stage: true,
          unit:  { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getContactById(id: string) {
  const { checkAndExpireReservation } = await import("@/lib/expiry")
  const opp = await prisma.opportunity.findUnique({
    where:  { contactId: id },
    select: { unitId: true },
  })
  if (opp?.unitId) await checkAndExpireReservation(opp.unitId)

  return prisma.contact.findUnique({
  where: { id, deletedAt: null },
  include: {
    project: { select: { id: true, name: true } },
    agent:   { select: { id: true, name: true, role: true } },
    notes: {
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    },
    contactDocuments: {                          
      orderBy: { createdAt: "desc" },
    },
    opportunity: {
      include: {
        unit: {
          include: {
            unitType: {
              include: { project: { select: { id: true, name: true } } },
            },
          },
        },
        ledgerEntries: { orderBy: { dueDate: "asc" } },
        documents:     { orderBy: { uploadedAt: "desc" } },
      },
    },
  },
})
}