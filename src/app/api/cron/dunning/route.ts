// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now       = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    // Find entries that became overdue in the last 24 hours
    const overdueEntries = await prisma.ledgerEntry.findMany({
      where: {
        status:  "PENDING",
        dueDate: { lt: now, gte: yesterday },
      },
      include: {
        opportunity: {
          include: {
            contact: true,
            unit:    { select: { name: true } },
          },
        },
      },
    })

    if (overdueEntries.length === 0) {
      return NextResponse.json({ message: "No overdue entries today", notified: 0 })
    }

    const results = await Promise.allSettled(
      overdueEntries.map(async (entry) => {
        const contact = entry.opportunity.contact
        if (!contact.email) return

        await resend.emails.send({
          from:    "Property ERP <noreply@yourdomain.com>",
          to:      contact.email,
          subject: `Payment reminder — ${entry.description}`,
          html: `
            <p>Dear ${contact.firstName},</p>
            <p>This is a reminder that your payment of <strong>KES ${Number(entry.amount).toLocaleString("en-KE")}</strong> for <strong>${entry.description}</strong> was due on <strong>${new Date(entry.dueDate).toLocaleDateString("en-KE")}</strong>.</p>
            <p>Please make payment as soon as possible and send your M-Pesa confirmation to your agent.</p>
            <p>Regards,<br/>Home Bridge Ltd.</p>
          `,
        })
      })
    )

    // Mark entries as OVERDUE in DB
    await prisma.ledgerEntry.updateMany({
      where: {
        status:  "PENDING",
        dueDate: { lt: now },
      },
      data: { status: "OVERDUE" },
    })

    const notified = results.filter((r) => r.status === "fulfilled").length

    console.log(`[cron/dunning] notified=${notified}`)

    return NextResponse.json({ notified })
  } catch (err) {
    console.error("[cron/dunning]", err)
    return NextResponse.json(
      { error: "Failed to run dunning job" },
      { status: 500 }
    )
  }
}