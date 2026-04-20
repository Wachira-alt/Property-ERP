import { prisma } from "@/lib/prisma"

export async function checkAndExpireReservation(unitId: string): Promise<void> {
  try {
    const unit = await prisma.unit.findUnique({
      where:   { id: unitId },
      include: { opportunity: true },
    })

    if (!unit)                           return
    if (unit.status !== "RESERVED")      return
    if (!unit.reservedUntil)             return
    if (new Date(unit.reservedUntil) > new Date()) return

    await prisma.$transaction([
      prisma.unit.update({
        where: { id: unitId },
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
  } catch (err) {
    console.error("[checkAndExpireReservation]", err)
  }
}