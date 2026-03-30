"use client"

import { useRef, useTransition, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createLedgerEntry, deleteLedgerEntry } from "@/actions/finance"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react"

type LedgerEntry = {
  id:          string
  description: string
  amount:      number | { toNumber: () => number }
  dueDate:     Date
  status:      string
}

type Props = {
  opportunityId: string
  contactId:     string
  agreedPrice:   number | { toNumber: () => number }
  entries:       LedgerEntry[]
}

const STATUS_STYLES = {
  PENDING: "text-[#d29922] bg-[#4a3000] border-[#9e6a03]",
  PAID:    "text-[#3fb950] bg-[#1a4f2a] border-[#2ea043]",
  OVERDUE: "text-[#f85149] bg-[#3d1f1f] border-[#da3633]",
}

export function ManualLedgerBuilder({
  opportunityId,
  contactId,
  agreedPrice,
  entries,
}: Props) {
  const formRef                      = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting]      = useState<string | null>(null)

  const agreed      = typeof agreedPrice === "object" ? agreedPrice.toNumber() : agreedPrice
  const ledgerTotal = entries.reduce(
    (sum, e) => sum + (typeof e.amount === "object" ? e.amount.toNumber() : Number(e.amount)),
    0
  )
  const isValid     = ledgerTotal >= agreed
  const gap         = agreed - ledgerTotal

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("opportunityId", opportunityId)

    startTransition(async () => {
      const result = await createLedgerEntry(fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Entry added")
        formRef.current?.reset()
      }
    })
  }

  async function handleDelete(entryId: string) {
    setDeleting(entryId)
    const result = await deleteLedgerEntry(entryId, contactId)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Entry removed")
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-5">
      {/* Validation banner */}
      <div
        className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${
          isValid
            ? "bg-[#1a4f2a1a] border-[#2ea04333] text-[#3fb950]"
            : "bg-[#4a30001a] border-[#9e6a0333] text-[#d29922]"
        }`}
      >
        {isValid ? (
          <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
        ) : (
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
        )}
        <div className="space-y-0.5">
          <p className="font-medium">
            {isValid
              ? `Ledger valid — ${formatCurrency(ledgerTotal)} scheduled`
              : `Ledger short by ${formatCurrency(gap)}`}
          </p>
          <p className="opacity-80">
            Agreed price: {formatCurrency(agreed)} · Scheduled: {formatCurrency(ledgerTotal)}
          </p>
        </div>
      </div>

      {/* Existing entries */}
      {entries.length > 0 && (
        <div className="space-y-1.5">
          {entries.map((entry) => {
            const amount = typeof entry.amount === "object"
              ? entry.amount.toNumber()
              : Number(entry.amount)

            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-[#0d1117] border border-[#21262d] rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#e6edf3] truncate">
                    {entry.description}
                  </p>
                  <p className="text-[11px] text-[#7d8590] mt-0.5">
                    Due {formatDate(entry.dueDate)}
                  </p>
                </div>

                <span className="text-xs font-semibold text-[#e6edf3] shrink-0">
                  {formatCurrency(amount)}
                </span>

                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                    STATUS_STYLES[entry.status as keyof typeof STATUS_STYLES]
                  }`}
                >
                  {entry.status}
                </span>

                {entry.status !== "PAID" && (
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleting === entry.id}
                    className="shrink-0 p-1 rounded text-[#484f58] hover:text-[#f85149] hover:bg-[#3d1f1f] transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add entry form */}
      <form ref={formRef} onSubmit={handleAdd} className="space-y-3">
        <p className="text-xs font-medium text-[#e6edf3]">Add payment entry</p>

        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label className="text-[#7d8590] text-xs">Description</Label>
            <Input
              name="description"
              required
              placeholder="e.g. Booking deposit, Instalment 1"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb] h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[#7d8590] text-xs">Amount (KES)</Label>
              <Input
                name="amount"
                type="number"
                min="1"
                required
                placeholder="500,000"
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb] h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#7d8590] text-xs">Due date</Label>
              <Input
                name="dueDate"
                type="date"
                required
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb] h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="sm"
          variant="ghost"
          disabled={isPending}
          className="gap-1.5 text-xs border border-[#30363d] hover:border-[#484f58] hover:bg-[#21262d] text-[#7d8590] hover:text-[#e6edf3]"
        >
          <Plus size={13} />
          {isPending ? "Adding…" : "Add entry"}
        </Button>
      </form>
    </div>
  )
}