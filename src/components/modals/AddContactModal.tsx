"use client"

import { useState, useRef } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
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
import { createContact } from "@/actions/contacts"

type Project = { id: string; name: string }
type Agent   = { id: string; name: string; role: string }
type Unit    = {
  id:       string
  name:     string
  floor:    string | null
  unitType: { name: string; projectId: string }
}

type Props = {
  projects: Project[]
  agents:   Agent[]
  units:    Unit[]
}

export function AddContactModal({ projects, agents, units }: Props) {
  const router  = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [projectId, setProjectId] = useState("")
  const [agentId, setAgentId]     = useState("")
  const [unitId, setUnitId]       = useState("")

  // Filter available units by selected project
  const filteredUnits = units.filter(
    (u) => u.unitType.projectId === projectId
  )

  function handleProjectChange(val: string) {
    setProjectId(val)
    setUnitId("") // reset unit when project changes
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!projectId || !agentId) {
      toast.error("Please select a project and agent")
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set("projectId", projectId)
    formData.set("agentId", agentId)
    if (unitId) formData.set("unitId", unitId)

    const result = await createContact(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Contact created")
      formRef.current?.reset()
      setProjectId("")
      setAgentId("")
      setUnitId("")
      setOpen(false)
      if (result.contactId) {
        router.push(`/contacts/${result.contactId}`)
      }
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={15} />
          New contact
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#e6edf3]">New Contact</DialogTitle>
          <p className="text-sm text-[#7d8590]">
            Create a lead and assign them to a project
          </p>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#e6edf3]">
                First name <span className="text-[#f85149]">*</span>
              </Label>
              <Input
                name="firstName"
                required
                placeholder="John"
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#e6edf3]">
                Last name <span className="text-[#f85149]">*</span>
              </Label>
              <Input
                name="lastName"
                required
                placeholder="Doe"
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-[#e6edf3]">
              Phone <span className="text-[#f85149]">*</span>
            </Label>
            <Input
              name="phone"
              required
              placeholder="0712 345 678"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-[#e6edf3]">Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="john@example.com"
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
            />
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <Label className="text-[#e6edf3]">
              Project <span className="text-[#f85149]">*</span>
            </Label>
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus:ring-[#1f6feb]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d]">
                {projects.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit — only shown after project selected */}
          {projectId && (
            <div className="space-y-1.5">
              <Label className="text-[#e6edf3]">
                Interested unit
                <span className="ml-1.5 text-[#484f58] text-[11px] font-normal">
                  optional
                </span>
              </Label>
              {filteredUnits.length === 0 ? (
                <div className="px-3 py-2.5 border border-dashed border-[#30363d] rounded-md">
                  <p className="text-xs text-[#484f58]">
                    No available units in this project
                  </p>
                </div>
              ) : (
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus:ring-[#1f6feb]">
                    <SelectValue placeholder="Select a unit (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b22] border-[#30363d]">
                    {filteredUnits.map((u) => (
                      <SelectItem
                        key={u.id}
                        value={u.id}
                        className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                      >
                        <span className="font-medium">{u.name}</span>
                        <span className="ml-2 text-[#7d8590] text-xs">
                          {u.unitType.name}
                        </span>
                        {u.floor && (
                          <span className="ml-1 text-[#484f58] text-xs">
                            · {u.floor} floor
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Sourcing agent */}
          <div className="space-y-1.5">
            <Label className="text-[#e6edf3]">
              Sourcing agent <span className="text-[#f85149]">*</span>
            </Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus:ring-[#1f6feb]">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d]">
                {agents.map((a) => (
                  <SelectItem
                    key={a.id}
                    value={a.id}
                    className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                  >
                    <span>{a.name}</span>
                    <span className="ml-2 text-[#484f58] text-xs capitalize">
                      {a.role.toLowerCase().replace("_", " ")}
                    </span>
                  </SelectItem>
                ))}
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
              disabled={loading || !projectId || !agentId}
            >
              {loading ? "Creating..." : "Create contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}