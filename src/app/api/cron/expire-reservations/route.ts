import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find all units whose reservation has expired
    const expiredUnits = await prisma.unit.findMany({
      where: {
        status:       "RESERVED",
        reservedUntil: { lt: now },
      },
      include: {
        opportunity: true,
      },
    })

    const results = await Promise.allSettled(
      expiredUnits.map(async (unit) => {
        await prisma.$transaction([
          prisma.unit.update({
            where: { id: unit.id },
            data:  { status: "AVAILABLE", reservedUntil: null },
          }),
          ...(unit.opportunity
            ? [
                prisma.opportunity.update({
                  where: { id: unit.opportunity.id },
                  data:  { stage: "EXPIRED" },
                }),
              ]
            : []),
        ])
        return unit.id
      })
    )

    const expired  = results.filter((r) => r.status === "fulfilled").length
    const failed   = results.filter((r) => r.status === "rejected").length

    console.log(`[cron/expire-reservations] Expired: ${expired}, Failed: ${failed}`)

    return NextResponse.json({ expired, failed })
  } catch (err) {
    console.error("[cron/expire-reservations]", err)
    return NextResponse.json({ error: "Failed to run expiry job" }, { status: 500 })
  }
}