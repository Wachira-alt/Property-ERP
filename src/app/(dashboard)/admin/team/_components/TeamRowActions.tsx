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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { deactivateUser, resetPassword, updateUser } from "@/actions/team"
import { MoreHorizontal, KeyRound, Pencil, UserX } from "lucide-react"

type Member = {
  id:       string
  name:     string
  email:    string
  role:     string
  isActive: boolean
}

type Props = {
  member:        Member
  currentUserId: string
}

const ROLES = [
  { value: "ADMIN",           label: "Admin" },
  { value: "GENERAL_MANAGER", label: "General Manager" },
  { value: "SALES",           label: "Sales" },
  { value: "ACCOUNTANT",      label: "Accountant" },
  { value: "HR",              label: "HR" },
]

export function TeamRowActions({ member, currentUserId }: Props) {
  const [editOpen, setEditOpen]   = useState(false)
  const [pwOpen, setPwOpen]       = useState(false)
  const [editRole, setEditRole]   = useState(member.role)
  const [editName, setEditName]   = useState(member.name)
  const [newPw, setNewPw]         = useState("")
  const [isPending, startTransition] = useTransition()

  const isSelf = member.id === currentUserId

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set("userId", member.id)
    fd.set("name",   editName)
    fd.set("role",   editRole)

    startTransition(async () => {
      const result = await updateUser(fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Member updated")
        setEditOpen(false)
      }
    })
  }

  function handleResetPw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set("userId",   member.id)
    fd.set("password", newPw)

    startTransition(async () => {
      const result = await resetPassword(fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Password reset successfully")
        setNewPw("")
        setPwOpen(false)
      }
    })
  }

  async function handleDeactivate() {
    if (!confirm(`Deactivate ${member.name}? They will lose access immediately.`)) return

    const result = await deactivateUser(member.id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Member deactivated")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-[#484f58] hover:text-[#e6edf3] hover:bg-[#21262d]"
          >
            <MoreHorizontal size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-[#161b22] border-[#30363d] text-[#e6edf3] min-w-[160px]"
        >
          <DropdownMenuItem
            onClick={() => setEditOpen(true)}
            className="text-xs gap-2 cursor-pointer focus:bg-[#21262d] focus:text-[#e6edf3]"
          >
            <Pencil size={12} />
            Edit member
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setPwOpen(true)}
            className="text-xs gap-2 cursor-pointer focus:bg-[#21262d] focus:text-[#e6edf3]"
          >
            <KeyRound size={12} />
            Reset password
          </DropdownMenuItem>
          {!isSelf && (
            <>
              <DropdownMenuSeparator className="bg-[#30363d]" />
              <DropdownMenuItem
                onClick={handleDeactivate}
                className="text-xs gap-2 cursor-pointer text-[#f85149] focus:bg-[#3d1f1f] focus:text-[#f85149]"
              >
                <UserX size={12} />
                Deactivate
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#e6edf3]">Edit member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[#e6edf3] text-xs">Full name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus-visible:ring-[#1f6feb]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#e6edf3] text-xs">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus:ring-[#1f6feb]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d]">
                  {ROLES.map((r) => (
                    <SelectItem
                      key={r.value}
                      value={r.value}
                      className="text-[#e6edf3] focus:bg-[#21262d]"
                    >
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
                className="text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#e6edf3]">Reset password</DialogTitle>
            <p className="text-sm text-[#7d8590]">{member.name}</p>
          </DialogHeader>
          <form onSubmit={handleResetPw} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[#e6edf3] text-xs">
                New password <span className="text-[#f85149]">*</span>
              </Label>
              <Input
                type="password"
                required
                minLength={8}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Min. 8 characters"
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPwOpen(false)}
                className="text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || newPw.length < 8}>
                {isPending ? "Resetting…" : "Reset password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}