import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canPerform } from "@/lib/permissions"
import { LedgerTable } from "./_components/LedgerTable"
import { StatementView } from "./_components/StatementView"
import { Wallet, FileText } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FilterStatus = "ALL" | "PENDING" | "PAID" | "OVERDUE"

type Props = {
  searchParams: Promise<{
    status?:    string
    view?:      string
    contactId?: string
  }>
}

export default async function FinancePage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!canPerform(session.role, "VIEW_FINANCE")) redirect("/contacts")

  const params   = await searchParams
  const status   = (params.status ?? "ALL") as FilterStatus
  const view     = params.view ?? "ledger"
  const contactId = params.contactId

  // Fetch all ledger entries with opportunity + contact data
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      ...(status !== "ALL" && status !== "OVERDUE" && { status }),
      ...(contactId && {
        opportunity: { contact: { id: contactId } },
      }),
    },
    include: {
      opportunity: {
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true },
          },
          unit: { select: { name: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  })

  // Filter overdue client-side (status=PENDING + dueDate < now)
  const now = new Date()
  const filtered = status === "OVERDUE"
    ? entries.filter(
        (e) => e.status === "PENDING" && new Date(e.dueDate) < now
      )
    : entries

  // Summary stats
  const totalScheduled = entries.reduce((s, e) => s + Number(e.amount), 0)
  const totalPaid      = entries
    .filter((e) => e.status === "PAID")
    .reduce((s, e) => s + Number(e.amount), 0)
  const totalPending   = entries
    .filter((e) => e.status === "PENDING")
    .reduce((s, e) => s + Number(e.amount), 0)
  const totalOverdue   = entries
    .filter((e) => e.status === "PENDING" && new Date(e.dueDate) < now)
    .reduce((s, e) => s + Number(e.amount), 0)

  // For statements view — group entries by contact
  const opportunityMap = new Map<string, typeof entries>()
  for (const entry of entries) {
    const key = entry.opportunity.contact.id
    if (!opportunityMap.has(key)) opportunityMap.set(key, [])
    opportunityMap.get(key)!.push(entry)
  }

  const statements = Array.from(opportunityMap.entries()).map(
    ([cId, cEntries]) => {
      const opp = cEntries[0].opportunity
      return {
        contactId:   cId,
        contactName: `${opp.contact.firstName} ${opp.contact.lastName}`,
        unitName:    opp.unit?.name ?? null,
        agreedPrice: 0,
        entries:     cEntries,
      }
    }
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Finance</h1>
        <p className="text-sm text-[#7d8590] mt-0.5">
          Payment ledger and statements of account
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total scheduled",
            value: formatCurrency(totalScheduled),
            color: "text-[#e6edf3]",
          },
          {
            label: "Total collected",
            value: formatCurrency(totalPaid),
            color: "text-[#3fb950]",
          },
          {
            label: "Outstanding",
            value: formatCurrency(totalPending),
            color: "text-[#d29922]",
          },
          {
            label: "Overdue",
            value: formatCurrency(totalOverdue),
            color: "text-[#f85149]",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="border border-[#30363d] rounded-lg bg-[#161b22] px-4 py-3.5"
          >
            <p className="text-[11px] text-[#7d8590]">{card.label}</p>
            <p className={`text-lg font-semibold mt-1 ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs: Ledger vs Statements */}
      <Tabs defaultValue={view} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-[#161b22] border border-[#30363d] p-1 h-auto">
            <TabsTrigger
              value="ledger"
              className="data-[state=active]:bg-[#21262d] data-[state=active]:text-[#e6edf3] text-[#7d8590] text-xs px-4 py-1.5"
            >
              <Wallet size={13} className="mr-1.5" />
              Ledger
            </TabsTrigger>
            <TabsTrigger
              value="statements"
              className="data-[state=active]:bg-[#21262d] data-[state=active]:text-[#e6edf3] text-[#7d8590] text-xs px-4 py-1.5"
            >
              <FileText size={13} className="mr-1.5" />
              Statements
            </TabsTrigger>
          </TabsList>

          {/* Status filter — ledger view only */}
          <div className="flex items-center gap-1.5">
            {(["ALL", "PENDING", "PAID", "OVERDUE"] as FilterStatus[]).map(
              (s) => (
                <Link
                  key={s}
                  href={`/finance?view=${view}${s !== "ALL" ? `&status=${s}` : ""}`}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                    status === s
                      ? "bg-[#21262d] border-[#484f58] text-[#e6edf3]"
                      : "border-[#30363d] text-[#7d8590] hover:text-[#e6edf3]"
                  }`}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Ledger tab */}
        <TabsContent value="ledger" className="mt-0">
          <LedgerTable entries={filtered as any} session={session} />
        </TabsContent>

        {/* Statements tab */}
        <TabsContent value="statements" className="mt-0 space-y-4">
          {statements.length === 0 ? (
            <div className="border border-dashed border-[#30363d] rounded-lg py-16 text-center">
              <FileText size={28} className="mx-auto text-[#484f58] mb-3" />
              <p className="text-sm text-[#e6edf3]">No statements available</p>
            </div>
          ) : (
            statements.map((s) => (
              <StatementView key={s.contactId} statement={s} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}