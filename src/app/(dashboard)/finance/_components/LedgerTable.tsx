import { PaymentRowAction } from "./PaymentRowAction"
import { formatCurrency, formatDate } from "@/lib/utils"
import { canPerform } from "@/lib/permissions"
import type { SessionUser } from "@/types/auth"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { DownloadBtn } from "@/components/shared/DownloadBtn"

type LedgerEntry = {
  id:          string
  description: string
  amount:      number | { toNumber: () => number }
  dueDate:     Date
  status:      string
  paidAt:      Date | null
  paymentRef:  string | null
  opportunity: {
    contact: {
      id:        string
      firstName: string
      lastName:  string
    }
    unit: {
      name: string
    } | null
  }
}

type Props = {
  entries: LedgerEntry[]
  session: SessionUser
}

const STATUS_STYLES = {
  PENDING: "bg-[#4a3000] text-[#d29922] border-[#9e6a03]",
  PAID:    "bg-[#1a4f2a] text-[#3fb950] border-[#2ea043]",
  OVERDUE: "bg-[#3d1f1f] text-[#f85149] border-[#da3633]",
} as const

export function LedgerTable({ entries, session }: Props) {
  const canMarkPaid = canPerform(session.role, "MARK_PAYMENT_PAID")

  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-[#30363d] rounded-lg py-16 text-center">
        <AlertCircle size={28} className="mx-auto text-[#484f58] mb-3" />
        <p className="text-sm font-medium text-[#e6edf3]">No entries found</p>
        <p className="text-xs text-[#7d8590] mt-1">
          Try adjusting your filters
        </p>
      </div>
    )
  }

  return (
    <div className="border border-[#30363d] rounded-lg overflow-hidden">
      {/* Table header — desktop */}
      <div className="hidden md:grid grid-cols-[1fr_130px_120px_100px_120px_110px] gap-4 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
        <span className="text-xs font-medium text-[#7d8590]">Description</span>
        <span className="text-xs font-medium text-[#7d8590]">Client</span>
        <span className="text-xs font-medium text-[#7d8590]">Amount</span>
        <span className="text-xs font-medium text-[#7d8590]">Due date</span>
        <span className="text-xs font-medium text-[#7d8590]">Status</span>
        {canMarkPaid && (
          <span className="text-xs font-medium text-[#7d8590]">Action</span>
        )}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#21262d]">
        {entries.map((entry) => {
          const amount     = typeof entry.amount === "object"
            ? entry.amount.toNumber()
            : Number(entry.amount)
          const status     = entry.status as keyof typeof STATUS_STYLES
          const isOverdue  = entry.status === "PENDING" && new Date(entry.dueDate) < new Date()
          const effectiveStatus = isOverdue ? "OVERDUE" : status

          return (
            <div
              key={entry.id}
              className="flex flex-col md:grid md:grid-cols-[1fr_130px_120px_100px_120px_110px] gap-2 md:gap-4 px-4 py-3.5 bg-[#0d1117] hover:bg-[#161b22] transition-colors"
            >
              {/* Description + unit */}
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#e6edf3] truncate">
                  {entry.description}
                </p>
                {entry.opportunity.unit && (
                  <p className="text-[10px] text-[#484f58] mt-0.5">
                    {entry.opportunity.unit.name}
                  </p>
                )}
                {/* Mobile — show client + amount */}
                <div className="flex items-center gap-3 mt-1 md:hidden">
                  <Link
                    href={`/contacts/${entry.opportunity.contact.id}`}
                    className="text-[11px] text-[#58a6ff] hover:underline"
                  >
                    {entry.opportunity.contact.firstName}{" "}
                    {entry.opportunity.contact.lastName}
                  </Link>
                  <span className="text-[11px] font-semibold text-[#e6edf3]">
                    {formatCurrency(amount)}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                      STATUS_STYLES[effectiveStatus] ?? STATUS_STYLES.PENDING
                    }`}
                  >
                    {effectiveStatus}
                  </span>
                </div>
                {/* Payment ref on mobile */}
                {entry.paymentRef && (
  <p className="text-[10px] text-[#484f58] font-mono mt-0.5 md:hidden">
    Ref: {entry.paymentRef}
  </p>
)}
{/* Receipt download on mobile */}
{entry.status === "PAID" && (
  <div className="md:hidden mt-1">
    <DownloadBtn
      url={`/api/documents/receipt?entryId=${entry.id}`}
      fileName={`receipt-${entry.id.slice(-6)}.pdf`}
      label="Download receipt"
      variant="inline"
    />
  </div>
)}
              </div>

              {/* Client — desktop */}
              <div className="hidden md:flex items-center min-w-0">
                <Link
                  href={`/contacts/${entry.opportunity.contact.id}`}
                  className="text-xs text-[#58a6ff] hover:underline truncate"
                >
                  {entry.opportunity.contact.firstName}{" "}
                  {entry.opportunity.contact.lastName}
                </Link>
              </div>

              {/* Amount — desktop */}
              <div className="hidden md:flex items-center">
                <span className="text-xs font-semibold text-[#e6edf3]">
                  {formatCurrency(amount)}
                </span>
              </div>

              {/* Due date — desktop */}
              <div className="hidden md:flex items-center">
                <span className="text-xs text-[#7d8590]">
                  {formatDate(entry.dueDate)}
                </span>
              </div>

              {/* Status — desktop */}
<div className="hidden md:flex items-center">
  <div className="space-y-1.5">
    <span
      className={`inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded border ${
        STATUS_STYLES[effectiveStatus] ?? STATUS_STYLES.PENDING
      }`}
    >
      {effectiveStatus}
    </span>
    {entry.paymentRef && (
      <p className="text-[10px] text-[#484f58] font-mono block">
        {entry.paymentRef}
      </p>
    )}
    {entry.paidAt && (
      <p className="text-[10px] text-[#484f58] block">
        {formatDate(entry.paidAt)}
      </p>
    )}
    {entry.status === "PAID" && (
      <DownloadBtn
        url={`/api/documents/receipt?entryId=${entry.id}`}
        fileName={`receipt-${entry.id.slice(-6)}.pdf`}
        label="Receipt"
        variant="ghost"
        className="text-[10px] h-auto py-0.5 px-1"
      />
    )}
  </div>
</div>

              {/* Action — desktop */}
              {canMarkPaid && (
                <div className="hidden md:flex items-center">
                  {entry.status === "PENDING" || isOverdue ? (
                    <PaymentRowAction
                      entryId={entry.id}
                      description={entry.description}
                      amount={amount}
                      dueDate={entry.dueDate}
                    />
                  ) : (
                    <span className="text-[10px] text-[#484f58]">—</span>
                  )}
                </div>
              )}

              {/* Mobile action */}
              {canMarkPaid && (entry.status === "PENDING" || isOverdue) && (
                <div className="md:hidden">
                  <PaymentRowAction
                    entryId={entry.id}
                    description={entry.description}
                    amount={amount}
                    dueDate={entry.dueDate}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}