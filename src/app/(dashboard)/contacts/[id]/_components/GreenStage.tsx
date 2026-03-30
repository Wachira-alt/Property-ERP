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
import { Home, ArrowRight } from "lucide-react"

type Unit = {
  id:       string
  name:     string
  floor:    string | null
  unitType: { name: string }
}

type Props = {
  contactId:      string
  assignedUnitId: string | null
  assignedUnit?:  { id: string; name: string } | null
  availableUnits: Unit[]
}

export function GreenStage({
  contactId,
  assignedUnitId,
  assignedUnit,
  availableUnits,
}: Props) {
  const [selectedUnit, setSelectedUnit] = useState(assignedUnitId ?? "")
  const [isPending, startTransition]    = useTransition()

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
    <div className="space-y-5">
      {/* Currently assigned */}
      {assignedUnit && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#1a4f2a1a] border border-[#2ea04333] rounded-lg">
          <Home size={14} className="text-[#3fb950] shrink-0" />
          <div>
            <p className="text-xs font-medium text-[#3fb950]">
              Currently assigned: {assignedUnit.name}
            </p>
            <p className="text-[11px] text-[#7d8590] mt-0.5">
              You can reassign to a different unit below
            </p>
          </div>
        </div>
      )}

      {/* Unit selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#e6edf3]">
          {assignedUnit ? "Reassign unit" : "Assign a unit"}
        </p>

        {availableUnits.length === 0 ? (
          <div className="px-4 py-6 border border-dashed border-[#30363d] rounded-lg text-center">
            <Home size={20} className="mx-auto text-[#484f58] mb-2" />
            <p className="text-xs text-[#7d8590]">
              No available units in this project
            </p>
            <p className="text-[11px] text-[#484f58] mt-1">
              Add units in Admin → Projects
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
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
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{unit.name}</span>
                      <span className="text-[#7d8590] text-xs">{unit.unitType.name}</span>
                      {unit.floor && (
                        <span className="text-[#484f58] text-xs">{unit.floor} floor</span>
                      )}
                    </div>
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
              {!isPending && <ArrowRight size={14} />}
            </Button>
          </div>
        )}
      </div>

      {/* Stage info */}
      <div className="border-t border-[#21262d] pt-4">
        <p className="text-[11px] text-[#484f58] leading-relaxed">
          This stage is non-binding. Assigning a unit tracks interest only —
          the unit remains available until a reservation is made.
          To move to Amber stage, the contact must have an assigned unit.
        </p>
      </div>
    </div>
  )
}