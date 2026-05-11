// @ts-nocheck
"use client"

import { useState } from "react"
import { PaymentRowAction } from "./PaymentRowAction"
import { formatCurrency, formatDate } from "@/lib/utils"
import { canPerform } from "@/lib/permissions"
import type { SessionUser } from "@/types/auth"
import { AlertCircle, ChevronRight, ChevronDown, FileCheck } from "lucide-react"
import { DownloadBtn } from "@/components/shared/DownloadBtn"

type LedgerEntry = {
  id:             string
  description:    string
  amount:         number
  dueDate:        Date
  status:         string
  paidAt:         Date | null
  paymentRef:     string | null
  receiptUrl:     string | null
  receiptFileKey: string | null
}

type OpportunityGroup = {
  opportunityId: string
  contact:       { id: string; firstName: string; lastName: string }
  unit:          { name: string } | null
  totalAmount:   number
  totalPaid:     number
  entries:       LedgerEntry[]
}

type Props = { groups: OpportunityGroup[]; session: SessionUser }

const STATUS_STYLES = {
  PENDING: "bg-[#4a3000] text-[#d29922] border-[#9e6a03]",
  PAID:    "bg-[#1a4f2a] text-[#3fb950] border-[#2ea043]",
  OVERDUE: "bg-[#3d1f1f] text-[#f85149] border-[#da3633]",
} as const

export function LedgerTable({ groups, session }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const canMarkPaid = canPerform(session.role, "MARK_PAYMENT_PAID")

  function toggleExpand(id: string) {
    const next = new Set(expandedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedIds(next)
  }

  if (groups.length === 0) {
    return (
      <div className="border border-dashed border-[#30363d] rounded-lg py-16 text-center">
        <AlertCircle size={28} className="mx-auto text-[#484f58] mb-3" />
        <p className="text-sm font-medium text-[#e6edf3]">No entries found</p>
      </div>
    )
  }

  return (
    <div className="border border-[#30363d] rounded-lg overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-[1fr_130px_120px_100px_120px_110px] gap-4 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
        <span className="text-xs font-medium text-[#7d8590]">Client / Description</span>
        <span className="text-xs font-medium text-[#7d8590]">Unit</span>
        <span className="text-xs font-medium text-[#7d8590]">Total Amount</span>
        <span className="text-xs font-medium text-[#7d8590]">Items</span>
        <span className="text-xs font-medium text-[#7d8590]">Status</span>
        <span className="text-xs font-medium text-[#7d8590]">Actions</span>
      </div>

      <div className="divide-y divide-[#21262d]">
        {groups.map((group) => {
          const isExpanded  = expandedIds.has(group.opportunityId)
          const hasOverdue  = group.entries.some(
            (e) => e.status === "PENDING" && new Date(e.dueDate) < new Date()
          )
          const isFullyPaid = group.totalPaid >= group.totalAmount
          const contactName = `${group.contact.firstName} ${group.contact.lastName}`

          return (
            <div key={group.opportunityId} className="flex flex-col">
              {/* Group Summary Row */}
              <div className="flex flex-col md:grid md:grid-cols-[1fr_130px_120px_100px_120px_110px] gap-2 md:gap-4 px-4 py-3.5 bg-[#0d1117] hover:bg-[#161b22] transition-colors group relative">
                <div
                  onClick={() => toggleExpand(group.opportunityId)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer"
                >
                  <div className="text-[#484f58] group-hover:text-[#e6edf3]">
                    {isExpanded
                      ? <ChevronDown size={14} />
                      : <ChevronRight size={14} />
                    }
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#58a6ff] truncate">
                      {contactName}
                    </span>
                    <span className="md:hidden text-[10px] text-[#7d8590] truncate">
                      {group.unit?.name ?? "No Unit"} · {group.entries.length} items
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center text-xs text-[#7d8590]">
                  {group.unit?.name ?? "—"}
                </div>
                <div className="hidden md:flex items-center text-xs font-semibold text-[#e6edf3]">
                  {formatCurrency(group.totalAmount)}
                </div>
                <div className="hidden md:flex items-center text-xs text-[#7d8590]">
                  {group.entries.length} items
                </div>
                <div className="hidden md:flex items-center">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                    hasOverdue
                      ? STATUS_STYLES.OVERDUE
                      : isFullyPaid
                      ? STATUS_STYLES.PAID
                      : STATUS_STYLES.PENDING
                  }`}>
                    {hasOverdue ? "OVERDUE" : isFullyPaid ? "FULLY PAID" : "PARTIAL"}
                  </span>
                </div>

                <div className="flex items-center gap-2 md:static absolute right-4 top-3.5">
                  <DownloadBtn
                    url={`/api/documents/statement?contactId=${group.contact.id}`}
                    fileName={`statement-${contactName.replace(/\s+/g, "-")}.pdf`}
                    label="Statement"
                    variant="ghost"
                    className="h-7 text-[10px] md:text-xs"
                  />
                </div>
              </div>

              {/* Nested Installment Entries */}
              {isExpanded && (
                <div className="bg-[#090c10] divide-y divide-[#21262d] border-t border-[#30363d]">
                  {group.entries.map((entry) => {
                    const isOverdue = entry.status === "PENDING" && new Date(entry.dueDate) < new Date()
                    const status    = (isOverdue ? "OVERDUE" : entry.status) as keyof typeof STATUS_STYLES

                    return (
                      <div
                        key={entry.id}
                        className="flex flex-col md:grid md:grid-cols-[1fr_130px_120px_100px_120px_110px] gap-2 md:gap-4 px-4 py-3.5 pl-10"
                      >
                        {/* Description */}
                        <div className="text-xs text-[#e6edf3] truncate">
                          {entry.description}
                        </div>

                        {/* Empty unit col */}
                        <div className="hidden md:block" />

                        {/* Amount */}
                        <div className="text-xs font-semibold text-[#e6edf3] md:flex md:items-center">
                          {formatCurrency(entry.amount)}
                        </div>

                        {/* Due date */}
                        <div className="text-xs text-[#7d8590] md:flex md:items-center">
                          {formatDate(entry.dueDate)}
                        </div>

                        {/* Status + receipt links */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${STATUS_STYLES[status]}`}>
                              {status}
                            </span>
                          </div>

                          {entry.status === "PAID" && (
                            <div className="flex flex-col gap-0.5">
                              {/* Generated PDF receipt */}
                              <DownloadBtn
                                url={`/api/documents/receipt?entryId=${entry.id}`}
                                fileName={`receipt-${entry.id.slice(-6)}.pdf`}
                                label="PDF receipt"
                                variant="ghost"
                                className="h-auto py-0.5 px-1 text-[10px] justify-start"
                              />
                              {/* Uploaded payment proof */}
                              {entry.receiptUrl && (
                                <a
                                  href={entry.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-[#3fb950] hover:underline px-1"
                                >
                                  <FileCheck size={10} />
                                  Payment proof
                                </a>
                              )}
                              {/* Payment ref */}
                              {entry.paymentRef && (
                                <span className="text-[10px] text-[#484f58] font-mono px-1">
                                  {entry.paymentRef}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Mark paid action */}
                        <div className="flex items-center">
                          {canMarkPaid && (entry.status === "PENDING" || isOverdue) && (
                            <PaymentRowAction
                              entryId={entry.id}
                              description={entry.description}
                              amount={entry.amount}
                              dueDate={entry.dueDate}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}