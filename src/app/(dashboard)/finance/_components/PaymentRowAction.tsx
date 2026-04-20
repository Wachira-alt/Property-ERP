// @ts-nocheck
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { markAsPaid } from "@/actions/finance"
import { CheckCircle2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

type Props = {
  entryId:     string
  description: string
  amount:      number
  dueDate:     Date
}

export function PaymentRowAction({
  entryId,
  description,
  amount,
  dueDate,
}: Props) {
  const [open, setOpen]              = useState(false)
  const [ref, setRef]                = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!ref.trim()) {
      toast.error("Payment reference is required")
      return
    }

    const fd = new FormData()
    fd.set("entryId",    entryId)
    fd.set("paymentRef", ref.trim())

    startTransition(async () => {
      const result = await markAsPaid(fd)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Payment marked as paid")
        setOpen(false)
        setRef("")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs h-7 border border-[#30363d] text-[#7d8590] hover:text-[#3fb950] hover:border-[#2ea043] hover:bg-[#1a4f2a1a]"
        >
          <CheckCircle2 size={12} />
          Mark paid
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">Record Payment</DialogTitle>
          <p className="text-sm text-[#7d8590]">
            Enter the M-Pesa or bank reference code for this payment.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Entry summary */}
          <div className="px-3 py-2.5 bg-[#0d1117] border border-[#21262d] rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7d8590]">Description</span>
              <span className="text-[#e6edf3] font-medium">{description}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7d8590]">Amount</span>
              <span className="text-[#e6edf3] font-semibold">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7d8590]">Due date</span>
              <span className="text-[#e6edf3]">{formatDate(dueDate)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#e6edf3] font-medium">
              Payment reference <span className="text-[#f85149]">*</span>
            </label>
            <Input
              required
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. QHX7Y2K3P1 or TXN-2024-001"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb] font-mono"
            />
            <p className="text-[10px] text-[#484f58]">
              M-Pesa code, bank reference, or any unique transaction identifier
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !ref.trim()}
              className="bg-[#238636] hover:bg-[#2ea043] text-white border-0"
            >
              {isPending ? "Recording…" : "Confirm payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}