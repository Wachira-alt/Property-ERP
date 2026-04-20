// @ts-nocheck
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { assertPermission } from "@/lib/permissions"
import { sendEmail } from "@/lib/mailer"

const createCampaignSchema = z.object({
  subject:  z.string().min(1, "Subject is required"),
  body:     z.string().min(1, "Message body is required"),
  audience: z.enum(["ALL", "GREEN", "AMBER", "CLOSED", "PAST"]),
})

// ─── Create draft campaign ────────────────────────────────────────────────────

export async function createCampaign(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "SEND_CAMPAIGN")

  const parsed = createCampaignSchema.safeParse({
    subject:  formData.get("subject"),
    body:     formData.get("body"),
    audience: formData.get("audience"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        subject:  parsed.data.subject,
        body:     parsed.data.body,
        audience: parsed.data.audience,
      },
    })

    revalidatePath("/marketing")
    return { success: true, campaignId: campaign.id }
  } catch {
    return { error: "Failed to save campaign." }
  }
}

// ─── Send campaign ────────────────────────────────────────────────────────────

export async function sendCampaign(campaignId: string) {
  const session = await requireAuth()
  assertPermission(session.role, "SEND_CAMPAIGN")

  try {
    const campaign = await prisma.campaign.findUnique({
      where:   { id: campaignId },
      include: { attachments: true },
    })

    if (!campaign)       return { error: "Campaign not found." }
    if (campaign.sentAt) return { error: "This campaign has already been sent." }

    // Build audience
    const contacts = await prisma.contact.findMany({
      where: {
        deletedAt: null,
        email:     { not: null },
        ...(campaign.audience !== "ALL" && {
          opportunity: { stage: campaign.audience as any },
        }),
      },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        email:     true,
      },
    })

    const recipients = contacts.filter((c) => c.email)
    if (recipients.length === 0) {
      return { error: "No contacts with email addresses in this audience." }
    }

    // Decode attachments from base64 — no Drive fetch needed
    const validAttachments = campaign.attachments.map((att) => ({
      filename: att.fileName,
      content:  Buffer.from(att.fileKey, "base64"),
      mimetype: att.mimeType,
    }))

    // Send in batches of 10 — Gmail SMTP rate limit
    const BATCH_SIZE = 10
    let sent   = 0
    let failed = 0

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map((contact) => {
          const personalised = campaign.body
            .replace(/\{\{name\}\}/g,      contact.firstName)
            .replace(/\{\{firstName\}\}/g, contact.firstName)
            .replace(/\{\{lastName\}\}/g,  contact.lastName)
            .replace(/\{\{email\}\}/g,     contact.email ?? "")

          return sendEmail({
            to:          contact.email!,
            subject:     campaign.subject,
            html:        wrapInTemplate(personalised, campaign.subject),
            attachments: validAttachments,
          })
        })
      )

      sent   += results.filter((r) => r.status === "fulfilled").length
      failed += results.filter((r) => r.status === "rejected").length

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((res) => setTimeout(res, 1000))
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data:  { sentAt: new Date(), sentCount: sent },
    })

    revalidatePath("/marketing")
    return { success: true, sent, failed }
  } catch (err) {
    console.error("[sendCampaign]", err)
    return { error: "Failed to send campaign. Check your Gmail credentials." }
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { attachments: true },
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

// ─── HTML wrapper ─────────────────────────────────────────────────────────────

function wrapInTemplate(body: string, subject: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f8fa; color: #1a1a1a; }
    .wrapper { max-width: 620px; margin: 32px auto; background: #ffffff; border: 1px solid #d0d7de; border-radius: 8px; overflow: hidden; }
    .header { background: #1f6feb; padding: 24px 32px; }
    .header h1 { color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }
    .header p { color: #a8c7fa; font-size: 12px; margin-top: 2px; }
    .body { padding: 32px; font-size: 15px; line-height: 1.7; color: #1a1a1a; }
    .body h1 { font-size: 22px; font-weight: 700; margin-bottom: 16px; color: #0d1117; }
    .body h2 { font-size: 18px; font-weight: 600; margin: 20px 0 10px; color: #0d1117; }
    .body h3 { font-size: 15px; font-weight: 600; margin: 16px 0 8px; color: #0d1117; }
    .body p { margin-bottom: 14px; }
    .body ul, .body ol { margin: 0 0 14px 24px; }
    .body li { margin-bottom: 6px; }
    .body strong { font-weight: 600; }
    .body em { font-style: italic; }
    .body a { color: #1f6feb; text-decoration: underline; }
    .body img { max-width: 100%; border-radius: 6px; margin: 12px 0; }
    .body blockquote { border-left: 3px solid #1f6feb; padding-left: 16px; color: #555; margin: 16px 0; }
    .footer { background: #f6f8fa; border-top: 1px solid #d0d7de; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 11px; color: #888; line-height: 1.6; }
    .footer a { color: #1f6feb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Lifestyle Properties Ltd.</h1>
      <p>Premium Real Estate · Nairobi, Kenya</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>
        Lifestyle Properties Ltd. · P.O Box 00100, Nairobi, Kenya<br>
        You are receiving this email because you are a client or lead of ours.<br>
        <a href="mailto:${process.env.GMAIL_USER}">Contact us</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// ─── Delete campaign ──────────────────────────────────────────────────────────

export async function deleteCampaign(campaignId: string) {
  const session = await requireAuth()

  if (!["ADMIN", "GENERAL_MANAGER"].includes(session.role)) {
    return { error: "You don't have permission to delete campaigns." }
  }

  try {
    await prisma.campaign.delete({ where: { id: campaignId } })
    revalidatePath("/marketing")
    return { success: true }
  } catch {
    return { error: "Failed to delete campaign." }
  }
}