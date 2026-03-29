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
import { createProject } from "@/actions/inventory"

export function AddProjectModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createProject(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Project created successfully")
      formRef.current?.reset()
      setOpen(false)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={15} />
          New Project
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">Create Project</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[#e6edf3]">
              Project name <span className="text-[#f85149]">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Bustani Gardens"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-[#e6edf3]">
              Location
            </Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g. Westlands, Nairobi"
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
              placeholder="Optional description"
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
              {loading ? "Creating..." : "Create project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}