"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { assertPermission } from "@/lib/permissions"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const createCampaignSchema = z.object({
  subject:  z.string().min(1, "Subject is required"),
  body:     z.string().min(1, "Message body is required"),
  audience: z.enum(["ALL", "GREEN", "AMBER", "CLOSED", "PAST"]),
})

export async function createCampaign(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "SEND_CAMPAIGN")

  const parsed = createCampaignSchema.safeParse({
    subject:  formData.get("subject"),
    body:     formData.get("body"),
    audience: formData.get("audience"),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { subject, body, audience } = parsed.data

  try {
    const campaign = await prisma.campaign.create({
      data: { subject, body },
    })

    return { success: true, campaignId: campaign.id }
  } catch {
    return { error: "Failed to create campaign." }
  }
}

export async function sendCampaign(campaignId: string, audience: string) {
  const session = await requireAuth()
  assertPermission(session.role, "SEND_CAMPAIGN")

  try {
    // Build the audience query
    const contacts = await prisma.contact.findMany({
      where: {
        deletedAt: null,
        email:     { not: null },
        ...(audience !== "ALL" && {
          opportunity: { stage: audience as any },
        }),
      },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        email:     true,
      },
    })

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) return { error: "Campaign not found." }
    if (campaign.sentAt) return { error: "This campaign has already been sent." }

    // Filter out nulls
    const recipients = contacts.filter((c) => c.email)

    if (recipients.length === 0) {
      return { error: "No contacts with email addresses in this audience." }
    }

    // Send in batches of 50 to respect rate limits
    const BATCH_SIZE = 50
    let sent = 0

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(
        batch.map((contact) =>
          resend.emails.send({
            from:    "Lifestyle Properties <noreply@yourdomain.com>",
            to:      contact.email!,
            subject: campaign.subject,
            html:    campaign.body
              .replace(/{{name}}/g, contact.firstName)
              .replace(/{{firstName}}/g, contact.firstName)
              .replace(/{{lastName}}/g, contact.lastName),
          })
        )
      )

      sent += batch.length
    }

    // Mark campaign as sent
    await prisma.campaign.update({
      where: { id: campaignId },
      data:  { sentAt: new Date() },
    })

    revalidatePath("/marketing")
    return { success: true, sent }
  } catch {
    return { error: "Failed to send campaign." }
  }
}

export async function getCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  })
}

export async function getAudienceCount(audience: string): Promise<number> {
  return prisma.contact.count({
    where: {
      deletedAt: null,
      email:     { not: null },
      ...(audience !== "ALL" && {
        opportunity: { stage: audience as any },
      }),
    },
  })
}