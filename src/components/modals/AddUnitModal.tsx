// @ts-nocheck
"use client"

import { useState, useRef } from "react"
import { Plus } from "lucide-react"
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
import { createUnit } from "@/actions/inventory"

type Props = {
  unitTypeId: string
  unitTypeName: string
}

export function AddUnitModal({ unitTypeId, unitTypeName }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set("unitTypeId", unitTypeId)
    const result = await createUnit(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Unit created")
      formRef.current?.reset()
      setOpen(false)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d] h-7"
        >
          <Plus size={12} />
          Add unit
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">Add Unit</DialogTitle>
          <p className="text-sm text-[#7d8590]">{unitTypeName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[#e6edf3]">
              Unit name <span className="text-[#f85149]">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Unit A1, Unit B4"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="floor" className="text-[#e6edf3]">
              Floor
            </Label>
            <Input
              id="floor"
              name="floor"
              placeholder="e.g. Ground, 1st, 2nd"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Add unit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}