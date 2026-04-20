// @ts-nocheck
"use client"

import { useState, useRef } from "react"
import { Plus, Eye, EyeOff } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createUser } from "@/actions/team"

const ROLES = [
  { value: "ADMIN",           label: "Admin" },
  { value: "GENERAL_MANAGER", label: "General Manager" },
  { value: "SALES",           label: "Sales" },
  { value: "ACCOUNTANT",      label: "Accountant" },
  { value: "HR",              label: "HR" },
]

export function AddUserModal() {
  const formRef               = useRef<HTMLFormElement>(null)
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole]       = useState("")
  const [showPw, setShowPw]   = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!role) {
      toast.error("Please select a role")
      return
    }

    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set("role", role)

    const result = await createUser(fd)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Team member created")
      formRef.current?.reset()
      setRole("")
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={15} />
          Add member
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">Add team member</DialogTitle>
          <p className="text-sm text-[#7d8590]">
            Create a new user account with role-based access
          </p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-[#e6edf3]">
              Full name <span className="text-[#f85149]">*</span>
            </Label>
            <Input
              name="name"
              required
              placeholder="Jane Wanjiku"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#e6edf3]">
              Email address <span className="text-[#f85149]">*</span>
            </Label>
            <Input
              name="email"
              type="email"
              required
              placeholder="jane@company.com"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#e6edf3]">
              Role <span className="text-[#f85149]">*</span>
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus:ring-[#1f6feb]">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d]">
                {ROLES.map((r) => (
                  <SelectItem
                    key={r.value}
                    value={r.value}
                    className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                  >
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#e6edf3]">
              Password <span className="text-[#f85149]">*</span>
            </Label>
            <div className="relative">
              <Input
                name="password"
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#7d8590]"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-[#484f58]">
              The user can change this after first login
            </p>
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
            <Button type="submit" disabled={loading || !role}>
              {loading ? "Creating…" : "Create member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}