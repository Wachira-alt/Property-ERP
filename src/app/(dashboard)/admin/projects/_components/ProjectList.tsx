// @ts-nocheck
"use client"

import { useState } from "react"
import { Building2, Layers, Home, ChevronRight, ChevronDown, Plus } from "lucide-react"
import { AddUnitTypeModal } from "@/components/modals/AddUnitTypeModal"
import { AddUnitModal } from "@/components/modals/AddUnitModal"
import { formatCurrency } from "@/lib/utils"

type Unit = {
  id: string
  name: string
  floor: string | null
  status: "AVAILABLE" | "RESERVED" | "SOLD"
}

type UnitType = {
  id: string
  name: string
  units: Unit[]
}

type Project = {
  id: string
  name: string
  location: string | null
  unitTypes: UnitType[]
}

const STATUS_STYLES = {
  AVAILABLE: "bg-[#1a4f2a] text-[#3fb950] border-[#2ea043]",
  RESERVED:  "bg-[#4a3000] text-[#d29922] border-[#9e6a03]",
  SOLD:      "bg-[#3d1f1f] text-[#f85149] border-[#da3633]",
} as const

export function ProjectList({ projects }: { projects: Project[] }) {
  const [expandedUnitTypes, setExpandedUnitTypes] = useState<Set<string>>(new Set())

  const toggleUnitType = (id: string) => {
    const next = new Set(expandedUnitTypes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedUnitTypes(next)
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const stats = {
          total: project.unitTypes.reduce((acc, ut) => acc + ut.units.length, 0),
          available: project.unitTypes.reduce((acc, ut) => acc + ut.units.filter(u => u.status === "AVAILABLE").length, 0),
          reserved: project.unitTypes.reduce((acc, ut) => acc + ut.units.filter(u => u.status === "RESERVED").length, 0),
          sold: project.unitTypes.reduce((acc, ut) => acc + ut.units.filter(u => u.status === "SOLD").length, 0),
        }

        return (
          <div key={project.id} className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
            {/* Project Header */}
            <div className="px-4 py-4 border-b border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#1f6feb1a] border border-[#1f6feb33] flex items-center justify-center shrink-0">
                  <Building2 size={15} className="text-[#1f6feb]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[#e6edf3] truncate">{project.name}</h2>
                  <p className="text-[10px] text-[#7d8590] mt-0.5 uppercase tracking-wider">{project.location || "No Location Set"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="flex items-center gap-3 text-[10px] font-medium">
                  <span className="flex items-center gap-1 text-[#3fb950]"><span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />{stats.available}</span>
                  <span className="flex items-center gap-1 text-[#d29922]"><span className="w-1.5 h-1.5 rounded-full bg-[#d29922]" />{stats.reserved}</span>
                  <span className="flex items-center gap-1 text-[#f85149]"><span className="w-1.5 h-1.5 rounded-full bg-[#f85149]" />{stats.sold}</span>
                </div>
                <AddUnitTypeModal projectId={project.id} projectName={project.name} />
              </div>
            </div>

            {/* Unit Types List */}
            <div className="divide-y divide-[#21262d]">
              {project.unitTypes.map((unitType) => {
                const isExpanded = expandedUnitTypes.has(unitType.id)
                return (
                  <div key={unitType.id} className="flex flex-col">
                    {/* Unit Type Toggle Header */}
                    <div 
                      onClick={() => toggleUnitType(unitType.id)}
                      className="px-4 py-3 flex items-center justify-between hover:bg-[#1c2128] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-[#484f58] group-hover:text-[#e6edf3]">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers size={13} className="text-[#7d8590]" />
                          <span className="text-xs font-medium text-[#e6edf3]">{unitType.name}</span>
                          <span className="text-[10px] text-[#484f58] bg-[#0d1117] px-1.5 py-0.5 rounded-full border border-[#21262d]">
                            {unitType.units.length} units
                          </span>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                         <AddUnitModal 
                            unitTypeId={unitType.id} 
                            unitTypeName={`${project.name} — ${unitType.name}`} 
                         />
                      </div>
                    </div>

                    {/* Expandable Unit Grid */}
                    {isExpanded && (
                      <div className="px-4 py-4 bg-[#0d1117] border-t border-[#21262d]">
                        {unitType.units.length === 0 ? (
                          <p className="text-[11px] text-[#484f58] italic py-2">No units added to this type yet.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {unitType.units.map((unit) => (
                              <div key={unit.id} className="border border-[#30363d] rounded-md px-3 py-2 bg-[#161b22] space-y-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Home size={11} className="text-[#484f58]" />
                                  <span className="text-[11px] font-medium text-[#e6edf3] truncate">{unit.name}</span>
                                </div>
                                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block ${STATUS_STYLES[unit.status]}`}>
                                  {unit.status}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}