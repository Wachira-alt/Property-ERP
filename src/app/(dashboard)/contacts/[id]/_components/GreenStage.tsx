"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { assignUnit } from "@/actions/contacts"
import { KYCUploader } from "./KYCUploader"
import { Home, ArrowRight, CheckCircle2, Circle } from "lucide-react"

type Unit = {
  id:       string
  name:     string
  floor:    string | null
  unitType: { name: string }
}

type Document = {
  id:        string
  type:      string
  fileName:  string
  fileUrl:   string
  uploadedAt: Date
}

type Props = {
  contactId:      string
  opportunityId:  string | null
  assignedUnitId: string | null
  assignedUnit?:  { id: string; name: string } | null
  availableUnits: Unit[]
  documents:      Document[]
}

export function GreenStage({
  contactId,
  opportunityId,
  assignedUnitId,
  assignedUnit,
  availableUnits,
  documents,
}: Props) {
  const [selectedUnit, setSelectedUnit] = useState(assignedUnitId ?? "")
  const [isPending, startTransition]    = useTransition()

  const hasNationalId = documents.some((d) => d.type === "NATIONAL_ID")
  const hasKraPin     = documents.some((d) => d.type === "KRA_PIN")
  const kycComplete   = hasNationalId && hasKraPin

  const nationalIdDoc = documents.find((d) => d.type === "NATIONAL_ID")
  const kraPinDoc     = documents.find((d) => d.type === "KRA_PIN")

  function handleAssign() {
    if (!selectedUnit) {
      toast.error("Please select a unit first")
      return
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set("contactId", contactId)
      fd.set("unitId", selectedUnit)

      const result = await assignUnit(fd)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Unit assigned successfully")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Unit assignment */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            assignedUnit ? "bg-[#1a4f2a]" : "bg-[#21262d]"
          }`}>
            {assignedUnit
              ? <CheckCircle2 size={12} className="text-[#3fb950]" />
              : <Circle size={12} className="text-[#484f58]" />
            }
          </div>
          <p className="text-xs font-medium text-[#e6edf3]">
            Step 1 — Assign a unit
          </p>
        </div>

        {assignedUnit && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#1a4f2a1a] border border-[#2ea04333] rounded-lg ml-7">
            <Home size={12} className="text-[#3fb950] shrink-0" />
            <p className="text-xs text-[#3fb950]">
              {assignedUnit.name}
            </p>
            <span className="text-[11px] text-[#7d8590] ml-1">— reassign below if needed</span>
          </div>
        )}

        {availableUnits.length === 0 ? (
          <div className="ml-7 px-4 py-4 border border-dashed border-[#30363d] rounded-lg text-center">
            <Home size={16} className="mx-auto text-[#484f58] mb-1.5" />
            <p className="text-xs text-[#7d8590]">No available units in this project</p>
            <p className="text-[11px] text-[#484f58] mt-0.5">Add units in Admin → Projects</p>
          </div>
        ) : (
          <div className="flex gap-2 ml-7">
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="flex-1 bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus:ring-[#1f6feb]">
                <SelectValue placeholder="Select an available unit" />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d]">
                {availableUnits.map((unit) => (
                  <SelectItem
                    key={unit.id}
                    value={unit.id}
                    className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                  >
                    <span className="font-medium">{unit.name}</span>
                    <span className="ml-2 text-[#7d8590] text-xs">{unit.unitType.name}</span>
                    {unit.floor && (
                      <span className="ml-1 text-[#484f58] text-xs">· {unit.floor} floor</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssign}
              disabled={isPending || !selectedUnit || selectedUnit === assignedUnitId}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              {isPending ? "Saving..." : "Assign"}
            </Button>
          </div>
        )}
      </div>

      {/* KYC Upload — only shown after unit is assigned */}
      {assignedUnit && opportunityId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              kycComplete ? "bg-[#1a4f2a]" : "bg-[#21262d]"
            }`}>
              {kycComplete
                ? <CheckCircle2 size={12} className="text-[#3fb950]" />
                : <Circle size={12} className="text-[#484f58]" />
              }
            </div>
            <p className="text-xs font-medium text-[#e6edf3]">
              Step 2 — Upload KYC documents
            </p>
          </div>

          <div className="ml-7 space-y-4">
            <KYCUploader
              opportunityId={opportunityId}
              type="NATIONAL_ID"
              label="National ID"
              description="Front and back scan or clear photo"
              uploaded={hasNationalId}
              fileUrl={nationalIdDoc?.fileUrl}
              fileName={nationalIdDoc?.fileName}
            />
            <KYCUploader
              opportunityId={opportunityId}
              type="KRA_PIN"
              label="KRA PIN Certificate"
              description="KRA PIN certificate PDF or photo"
              uploaded={hasKraPin}
              fileUrl={kraPinDoc?.fileUrl}
              fileName={kraPinDoc?.fileName}
            />
          </div>
        </div>
      )}

      {/* Readiness summary */}
      {assignedUnit && (
        <div className="border-t border-[#21262d] pt-4 space-y-2">
          <p className="text-[11px] font-medium text-[#7d8590] uppercase tracking-wider">
            Checklist to move to Amber
          </p>
          <div className="space-y-1.5">
            <ChecklistItem done={!!assignedUnit} label="Unit assigned" />
            <ChecklistItem done={hasNationalId} label="National ID uploaded" />
            <ChecklistItem done={hasKraPin} label="KRA PIN uploaded" />
          </div>

          {!kycComplete && (
            <p className="text-[11px] text-[#d29922] mt-2">
              Upload both KYC documents to enable the Move to Amber button.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {done
        ? <CheckCircle2 size={12} className="text-[#3fb950] shrink-0" />
        : <Circle size={12} className="text-[#484f58] shrink-0" />
      }
      <span className={`text-xs ${done ? "text-[#e6edf3]" : "text-[#484f58]"}`}>
        {label}
      </span>
    </div>
  )
}