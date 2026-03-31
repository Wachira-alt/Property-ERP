"use client"

import { useTransition, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { finalizeSale } from "@/actions/pipeline"
import { ShieldCheck, AlertTriangle } from "lucide-react"

type Props = {
  contactId:   string
  contactName: string
  unitName:    string
  agreedPrice: string
}

export function FinalizeSaleBtn({
  contactId,
  contactName,
  unitName,
  agreedPrice,
}: Props) {
  const [open, setOpen]              = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleFinalize() {
    startTransition(async () => {
      const result = await finalizeSale(contactId)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Sale finalized — unit is now SOLD")
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 text-xs h-7 bg-[#1f6feb] hover:bg-[#388bfd] text-white font-medium border-0"
        >
          <ShieldCheck size={13} />
          Finalize Sale
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">Confirm Finalization</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Warning */}
          <div className="flex items-start gap-2.5 px-3 py-3 bg-[#4a30001a] border border-[#9e6a0333] rounded-lg">
            <AlertTriangle size={14} className="text-[#d29922] shrink-0 mt-0.5" />
            <p className="text-xs text-[#d29922] leading-relaxed">
              This action is irreversible. The unit will be permanently marked
              as SOLD and removed from available inventory.
            </p>
          </div>

          {/* Summary */}
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7d8590]">Client</span>
              <span className="text-[#e6edf3] font-medium">{contactName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7d8590]">Unit</span>
              <span className="text-[#e6edf3] font-medium">{unitName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7d8590]">Sale price</span>
              <span className="text-[#e6edf3] font-semibold">{agreedPrice}</span>
            </div>
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
              onClick={handleFinalize}
              disabled={isPending}
              className="bg-[#1f6feb] hover:bg-[#388bfd] text-white border-0"
            >
              {isPending ? "Finalizing…" : "Confirm & finalize"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}