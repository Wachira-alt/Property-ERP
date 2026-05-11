// @ts-nocheck
"use client"

import { useState, useTransition, useRef } from "react"
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
import { CheckCircle2, Upload, FileCheck, Loader2, X } from "lucide-react"
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
  const [open, setOpen]               = useState(false)
  const [ref, setRef]                 = useState("")
  const [isPending, startTransition]  = useTransition()
  const [uploading, setUploading]     = useState(false)
  const [receiptUrl, setReceiptUrl]   = useState("")
  const [receiptKey, setReceiptKey]   = useState("")
  const [receiptName, setReceiptName] = useState("")
  const fileInputRef                  = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file",    file)
      fd.append("docType", "payment_receipt")

      const res  = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Upload failed")
        return
      }

      setReceiptUrl(data.viewUrl)
      setReceiptKey(data.fileId)
      setReceiptName(file.name)
      toast.success("Receipt uploaded")
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  function clearReceipt() {
    setReceiptUrl("")
    setReceiptKey("")
    setReceiptName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!ref.trim()) {
      toast.error("Payment reference is required")
      return
    }

    const fd = new FormData()
    fd.set("entryId",    entryId)
    fd.set("paymentRef", ref.trim())
    if (receiptUrl)  fd.set("receiptUrl",     receiptUrl)
    if (receiptKey)  fd.set("receiptFileKey", receiptKey)

    startTransition(async () => {
      const result = await markAsPaid(fd)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Payment recorded successfully")
        setOpen(false)
        setRef("")
        clearReceipt()
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
            Enter the payment reference and optionally upload a receipt.
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

          {/* Payment reference */}
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

          {/* Receipt upload */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#e6edf3] font-medium">
              Payment receipt
              <span className="ml-1.5 text-[#484f58] font-normal">optional</span>
            </label>

            {receiptName ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#1a4f2a1a] border border-[#2ea04333] rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck size={14} className="text-[#3fb950] shrink-0" />
                  <span className="text-xs text-[#3fb950] truncate">
                    {receiptName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearReceipt}
                  className="text-[#484f58] hover:text-[#f85149] shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-3 border border-dashed border-[#30363d] rounded-lg cursor-pointer hover:border-[#484f58] hover:bg-[#21262d] transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="text-[#7d8590] animate-spin" />
                    <span className="text-xs text-[#7d8590]">Uploading…</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} className="text-[#484f58]" />
                    <span className="text-xs text-[#7d8590]">
                      Click to upload receipt
                    </span>
                    <span className="text-[10px] text-[#484f58]">
                      PDF, JPG, PNG — max 8MB
                    </span>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
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
              disabled={isPending || uploading || !ref.trim()}
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