import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canPerform } from "@/lib/permissions"
import { LedgerTable } from "./_components/LedgerTable"
import { Wallet, Info } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

type FilterStatus = "ALL" | "PENDING" | "PAID" | "OVERDUE"

type Props = {
  searchParams: Promise<{
    status?:    string
    contactId?: string
  }>
}

export default async function FinancePage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!canPerform(session.role, "VIEW_FINANCE")) redirect("/contacts")

  const params    = await searchParams
  const status    = (params.status ?? "ALL") as FilterStatus
  const contactId = params.contactId

  // Fetch entries with necessary relations
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
          contact: { select: { id: true, firstName: true, lastName: true } },
          unit:    { select: { name: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  })

  const now = new Date()
  
  // Stats calculation
  const totalScheduled = entries.reduce((s, e) => s + Number(e.amount), 0)
  const totalPaid      = entries.filter((e) => e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0)
  const totalPending   = entries.filter((e) => e.status === "PENDING").reduce((s, e) => s + Number(e.amount), 0)
  const totalOverdue   = entries.filter((e) => e.status === "PENDING" && new Date(e.dueDate) < now).reduce((s, e) => s + Number(e.amount), 0)

  // Group entries by Contact for the LedgerTable
  const groupsMap = new Map<string, any>()
  entries.forEach((entry) => {
    const key = entry.opportunity.contact.id
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        opportunityId: entry.opportunityId,
        contact:       entry.opportunity.contact,
        unit:          entry.opportunity.unit,
        totalAmount:   0,
        totalPaid:     0,
        entries:       [],
      })
    }
    const group = groupsMap.get(key)
    const amt = Number(entry.amount)
    group.totalAmount += amt
    if (entry.status === "PAID") group.totalPaid += amt
    group.entries.push({ ...entry, amount: amt })
  })

  let groupedData = Array.from(groupsMap.values())
  if (status === "OVERDUE") {
    groupedData = groupedData.filter(g => g.entries.some((e: any) => e.status === "PENDING" && new Date(e.dueDate) < now))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Finance</h1>
          <p className="text-sm text-[#7d8590] mt-0.5">Manage payment ledgers and generate statements</p>
        </div>
        
        {/* Status filters - Mobile friendly scroll if needed */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {["ALL", "PENDING", "PAID", "OVERDUE"].map((s) => (
            <Link
              key={s}
              href={`/finance?${s !== "ALL" ? `status=${s}` : ""}`}
              className={`text-xs px-3 py-1.5 rounded-md border whitespace-nowrap transition-colors ${
                status === s ? "bg-[#21262d] border-[#484f58] text-[#e6edf3]" : "border-[#30363d] text-[#7d8590] hover:text-[#e6edf3]"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary cards - Responsive 2x2 or 4x1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total scheduled", value: formatCurrency(totalScheduled), color: "text-[#e6edf3]" },
          { label: "Total collected", value: formatCurrency(totalPaid), color: "text-[#3fb950]" },
          { label: "Outstanding", value: formatCurrency(totalPending), color: "text-[#d29922]" },
          { label: "Overdue", value: formatCurrency(totalOverdue), color: "text-[#f85149]" },
        ].map((card) => (
          <div key={card.label} className="border border-[#30363d] rounded-lg bg-[#161b22] px-4 py-3.5">
            <p className="text-[11px] text-[#7d8590] uppercase tracking-wider">{card.label}</p>
            <p className={`text-lg font-semibold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#7d8590]">
          <Wallet size={14} />
          <h2 className="text-sm font-medium">Payment Ledger</h2>
        </div>

        {/* The LedgerTable now handles everything:
           1. Expanding rows to see individual payments
           2. "Mark Paid" actions via PaymentRowAction
           3. "Download Statement" for the whole group
        */}
        <LedgerTable groups={groupedData} session={session} />
      </div>

      {/* Helper Footer */}
      {/* <div className="flex items-start gap-2 p-3 rounded-md bg-[#0d1117] border border-[#30363d]">
        <Info size={14} className="text-[#58a6ff] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[#7d8590] leading-relaxed">
          Click on a client row to view detailed installment breakdowns. 
          Statements can be downloaded directly from the client row action menu.
        </p>
      </div> */}
    </div>
  )
}