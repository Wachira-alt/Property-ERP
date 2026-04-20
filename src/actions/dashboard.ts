// @ts-nocheck
"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function getDashboardData() {
  await requireAuth()

  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sevenDaysFromNow = new Date(now)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const [
    // Pipeline
    pipelineCounts,
    recentContacts,

    // Inventory
    unitCounts,
    projectSummaries,

    // Finance
    ledgerSummary,
    overdueEntries,
    recentPayments,

    // Team
    teamPerformance,

    // Alerts
    expiringReservations,
  ] = await Promise.all([

    // ── Pipeline counts per stage ─────────────────────────────────────────
    prisma.opportunity.groupBy({
      by:    ["stage"],
      _count: { stage: true },
    }),

    // ── Contacts created in last 30 days ──────────────────────────────────
    prisma.contact.findMany({
      where:   { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      select:  { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // ── Unit status counts ────────────────────────────────────────────────
    prisma.unit.groupBy({
      by:     ["status"],
      _count: { status: true },
    }),

    // ── Project summaries ─────────────────────────────────────────────────
    prisma.project.findMany({
      where:   { isActive: true },
      select: {
        id:   true,
        name: true,
        unitTypes: {
          select: {
            units: {
              select: { status: true },
            },
          },
        },
      },
    }),

    // ── Ledger summary — total scheduled, paid, outstanding ───────────────
    prisma.ledgerEntry.aggregate({
  _sum: { amount: true },
}).then(async (total: { _sum: { amount: unknown } }) => {
      const paid = await prisma.ledgerEntry.aggregate({
        where: { status: "PAID" },
        _sum:  { amount: true },
      })
      const overdue = await prisma.ledgerEntry.aggregate({
        where: { status: "PENDING", dueDate: { lt: now } },
        _sum:  { amount: true },
      })
      return {
        totalScheduled: Number(total._sum.amount ?? 0),
        totalPaid:      Number(paid._sum.amount ?? 0),
        totalOverdue:   Number(overdue._sum.amount ?? 0),
      }
    }),

    // ── Overdue entries with contact info ─────────────────────────────────
    prisma.ledgerEntry.findMany({
      where: {
        status:  "PENDING",
        dueDate: { lt: now },
      },
      include: {
        opportunity: {
          include: {
            contact: { select: { id: true, firstName: true, lastName: true } },
            unit:    { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take:    10,
    }),

    // ── Recent payments (last 7 days) ─────────────────────────────────────
    prisma.ledgerEntry.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: sevenDaysAgo },
      },
      include: {
        opportunity: {
          include: {
            contact: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take:    8,
    }),

    // ── Team performance — contacts + closed deals per agent ─────────────
    prisma.user.findMany({
      where:  { isActive: true, deletedAt: null },
      select: {
        id:   true,
        name: true,
        role: true,
        _count: {
          select: { assignedContacts: true },
        },
        assignedContacts: {
          select: {
            opportunity: {
              select: { stage: true },
            },
          },
        },
      },
    }),

    // ── Reservations expiring within 7 days ───────────────────────────────
    prisma.unit.findMany({
      where: {
        status:        "RESERVED",
        reservedUntil: { gte: now, lte: sevenDaysFromNow },
      },
      include: {
        opportunity: {
          include: {
            contact: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        unitType: {
          include: { project: { select: { name: true } } },
        },
      },
      orderBy: { reservedUntil: "asc" },
    }),
  ])

  // ── Process pipeline data ───────────────────────────────────────────────
  const stageMap = Object.fromEntries(
    pipelineCounts.map((p) => [p.stage, p._count.stage])
  )

  // ── Process unit inventory ──────────────────────────────────────────────
  const unitMap = Object.fromEntries(
    unitCounts.map((u) => [u.status, u._count.status])
  )

  // ── Process project breakdown ───────────────────────────────────────────
  const projects = projectSummaries.map((p) => {
    const allUnits   = p.unitTypes.flatMap((ut) => ut.units)
    const available  = allUnits.filter((u) => u.status === "AVAILABLE").length
    const reserved   = allUnits.filter((u) => u.status === "RESERVED").length
    const sold       = allUnits.filter((u) => u.status === "SOLD").length
    const total      = allUnits.length
    const soldPct    = total > 0 ? Math.round((sold / total) * 100) : 0
    return { id: p.id, name: p.name, total, available, reserved, sold, soldPct }
  })

  // ── Process team performance ────────────────────────────────────────────
  const team = teamPerformance
  .map((user) => {
    const contacts = user.assignedContacts
    const green    = contacts.filter((c) => c.opportunity?.stage === "GREEN").length
    const amber    = contacts.filter((c) => c.opportunity?.stage === "AMBER").length
    const closed   = contacts.filter((c) => c.opportunity?.stage === "CLOSED").length
    const past     = contacts.filter((c) => c.opportunity?.stage === "PAST").length
    const total    = user._count.assignedContacts

    return {
      id:   user.id,
      name: user.name,
      role: user.role,
      total,
      green,
      amber,
      closed,
      past,
      conversion: total > 0
        ? Math.round(((closed + past) / total) * 100)
        : 0,
    }
  })
  .filter((u) => u.total > 0)
  .sort((a, b) => (b.closed + b.past) - (a.closed + a.past))

  // ── Process lead intake trend (30 days, weekly buckets) ─────────────────
  const weeks: { label: string; count: number }[] = []
  for (let w = 3; w >= 0; w--) {
    const start = new Date(now)
    start.setDate(start.getDate() - (w + 1) * 7)
    const end = new Date(now)
    end.setDate(end.getDate() - w * 7)
    const count = recentContacts.filter(
      (c) => c.createdAt >= start && c.createdAt < end
    ).length
    const label = `W${4 - w}`
    weeks.push({ label, count })
  }

  return {
    pipeline: {
      green:     stageMap["GREEN"]     ?? 0,
      amber:     stageMap["AMBER"]     ?? 0,
      closed:    stageMap["CLOSED"]    ?? 0,
      past:      stageMap["PAST"]      ?? 0,
      expired:   stageMap["EXPIRED"]   ?? 0,
      cancelled: stageMap["CANCELLED"] ?? 0,
      total: Object.values(stageMap).reduce((a, b) => a + b, 0),
    },
    inventory: {
      available: unitMap["AVAILABLE"] ?? 0,
      reserved:  unitMap["RESERVED"]  ?? 0,
      sold:      unitMap["SOLD"]      ?? 0,
      total: Object.values(unitMap).reduce((a, b) => a + b, 0),
    },
    projects,
    finance:  ledgerSummary,
    overdueEntries,
    recentPayments,
    team,
    expiringReservations,
    trend: weeks,
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>