import { formatCurrency, formatDate } from "@/lib/utils"
import { TrendingUp, TrendingDown, Clock } from "lucide-react"
import Link from "next/link"
import { DownloadBtn } from "@/components/shared/DownloadBtn"

type LedgerEntry = {
  id:          string
  description: string
  amount:      number | { toNumber: () => number }
  dueDate:     Date
  paidAt:      Date | null
  paymentRef:  string | null
  status:      string
}

type ContactStatement = {
  contactId:   string
  contactName: string
  unitName:    string | null
  agreedPrice: number
  entries:     LedgerEntry[]
}

type Props = {
  statement: ContactStatement
}

export function StatementView({ statement }: Props) {
  const entries = statement.entries

  const total   = entries.reduce(
    (s, e) => s + (typeof e.amount === "object" ? e.amount.toNumber() : Number(e.amount)),
    0
  )
  const paid    = entries
    .filter((e) => e.status === "PAID")
    .reduce(
      (s, e) => s + (typeof e.amount === "object" ? e.amount.toNumber() : Number(e.amount)),
      0
    )
  const outstanding = total - paid

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#30363d] flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/contacts/${statement.contactId}`}
            className="text-sm font-semibold text-[#58a6ff] hover:underline"
          >
            {statement.contactName}
          </Link>
          {statement.unitName && (
            <p className="text-xs text-[#7d8590] mt-0.5">{statement.unitName}</p>
          )}
        </div>

        {/* Running balance summary */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-[#7d8590]">Total scheduled</p>
            <p className="text-xs font-semibold text-[#e6edf3]">
              {formatCurrency(total)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#7d8590]">Paid</p>
            <p className="text-xs font-semibold text-[#3fb950]">
              {formatCurrency(paid)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#7d8590]">Outstanding</p>
            <p className={`text-xs font-semibold ${
              outstanding > 0 ? "text-[#f85149]" : "text-[#3fb950]"
            }`}>
              {formatCurrency(outstanding)}
            </p>
          </div>
        </div>
         {/* Download statement */}
    <DownloadBtn
      url={`/api/documents/statement?contactId=${statement.contactId}`}
      fileName={`statement-${statement.contactName.replace(/\s+/g, "-")}.pdf`}
      label="Statement"
      variant="default"
    />
      </div>

      {/* Progress bar */}
      <div className="px-5 py-2 bg-[#0d1117] border-b border-[#21262d]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#7d8590]">Payment progress</span>
          <span className="text-[10px] text-[#7d8590]">
            {total > 0 ? Math.round((paid / total) * 100) : 0}%
          </span>
        </div>
        <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#3fb950] rounded-full transition-all"
            style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-[#21262d]">
        {entries.map((entry, idx) => {
          const amount  = typeof entry.amount === "object"
            ? entry.amount.toNumber()
            : Number(entry.amount)
          const isOverdue = entry.status === "PENDING" && new Date(entry.dueDate) < new Date()

          return (
            <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
              {/* Index */}
              <span className="text-[10px] text-[#484f58] w-4 shrink-0">
                {idx + 1}
              </span>

              {/* Description + dates */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#e6edf3] truncate">{entry.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-[#484f58]">
                    <Clock size={9} />
                    Due {formatDate(entry.dueDate)}
                  </span>
                  {entry.paidAt && (
                    <span className="text-[10px] text-[#3fb950]">
                      · Paid {formatDate(entry.paidAt)}
                    </span>
                  )}
                  {entry.paymentRef && (
                    <span className="text-[10px] text-[#484f58] font-mono">
                      · {entry.paymentRef}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount */}
              <span className="text-xs font-semibold text-[#e6edf3] shrink-0">
                {formatCurrency(amount)}
              </span>

              {/* Status icon */}
              <div className="shrink-0 w-5 flex justify-center">
                {entry.status === "PAID" ? (
                  <TrendingUp size={13} className="text-[#3fb950]" />
                ) : isOverdue ? (
                  <TrendingDown size={13} className="text-[#f85149]" />
                ) : (
                  <Clock size={13} className="text-[#d29922]" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}