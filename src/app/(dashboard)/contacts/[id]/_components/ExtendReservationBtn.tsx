// @ts-nocheck
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { extendReservation } from "@/actions/pipeline"
import { CalendarPlus } from "lucide-react"

type Props = {
  unitId:        string
  unitName:      string
  currentExpiry: Date | null
}

export function ExtendReservationBtn({ unitId, unitName, currentExpiry }: Props) {
  const [open, setOpen]              = useState(false)
  const [days, setDays]              = useState("")
  const [reason, setReason]          = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const fd = new FormData()
    fd.set("unitId", unitId)
    fd.set("days",   days)
    if (reason) fd.set("reason", reason)

    startTransition(async () => {
      const result = await extendReservation(fd)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Reservation extended by ${days} day${days === "1" ? "" : "s"}`)
        setOpen(false)
        setDays("")
        setReason("")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs h-7 border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] hover:border-[#484f58] hover:bg-[#21262d]"
        >
          <CalendarPlus size={13} />
          Extend reservation
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">Extend Reservation</DialogTitle>
          <p className="text-sm text-[#7d8590]">
            {unitName} · Expires{" "}
            {currentExpiry
              ? new Date(currentExpiry).toLocaleDateString("en-KE", {
                  day: "2-digit", month: "short", year: "numeric",
                })
              : "—"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-[#e6edf3] text-xs">
              Extend by (days) <span className="text-[#f85149]">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              max="30"
              required
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="e.g. 7"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
            <p className="text-[10px] text-[#484f58]">Maximum 30 days per extension</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#e6edf3] text-xs">Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional justification"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
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
              disabled={isPending || !days}
            >
              {isPending ? "Extending…" : "Extend reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}