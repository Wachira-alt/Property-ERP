// @ts-nocheck
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { moveToReservation } from "@/actions/pipeline"
import { ArrowRight } from "lucide-react"

type Props = {
  contactId: string
}

export function MoveToAmberBtn({ contactId }: Props) {
  const [open, setOpen]               = useState(false)
  const [agreedPrice, setAgreedPrice] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [isPending, startTransition]  = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!agreedPrice || !paymentMethod) {
      toast.error("Please fill in all fields")
      return
    }

    const fd = new FormData()
    fd.set("contactId",     contactId)
    fd.set("agreedPrice",   agreedPrice)
    fd.set("paymentMethod", paymentMethod)

    startTransition(async () => {
      const result = await moveToReservation(fd)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Reservation created — unit locked for 7 days")
        setOpen(false)
        setAgreedPrice("")
        setPaymentMethod("")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 text-xs h-7 bg-[#d29922] hover:bg-[#bb8009] text-[#0d1117] font-medium border-0"
        >
          <ArrowRight size={13} />
          Move to Amber
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">Create Reservation</DialogTitle>
          <p className="text-sm text-[#7d8590]">
            Set the agreed price and payment method to lock the unit for 7 days.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-[#e6edf3] text-xs">
              Agreed price (KES) <span className="text-[#f85149]">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              required
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              placeholder="e.g. 5000000"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#e6edf3] text-xs">
              Payment method <span className="text-[#f85149]">*</span>
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus:ring-[#1f6feb]">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d]">
                <SelectItem
                  value="CASH"
                  className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                >
                  Cash
                </SelectItem>
                <SelectItem
                  value="MORTGAGE"
                  className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                >
                  Mortgage
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              disabled={isPending || !agreedPrice || !paymentMethod}
              className="bg-[#d29922] hover:bg-[#bb8009] text-[#0d1117] font-medium border-0"
            >
              {isPending ? "Creating…" : "Confirm reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}