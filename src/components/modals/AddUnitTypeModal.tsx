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
import { createUnitType } from "@/actions/inventory"

type Props = {
  projectId: string
  projectName: string
}

export function AddUnitTypeModal({ projectId, projectName }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set("projectId", projectId)
    const result = await createUnitType(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Unit type created")
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
          Add unit type
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">Add Unit Type</DialogTitle>
          <p className="text-sm text-[#7d8590]">{projectName}</p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[#e6edf3]">
              Unit type name <span className="text-[#f85149]">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Studio, 2 Bedroom, Penthouse"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-[#e6edf3]">
              Description
            </Label>
            <Input
              id="description"
              name="description"
              placeholder="Optional notes about this unit type"
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
              {loading ? "Creating..." : "Add unit type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}