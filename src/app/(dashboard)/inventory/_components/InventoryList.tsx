// @ts-nocheck
"use client"

import { useState } from "react"
import { Building2, Layers, Home, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_STYLES = {
  AVAILABLE: "bg-[#1a4f2a] text-[#3fb950] border-[#2ea043]",
  RESERVED:  "bg-[#4a3000] text-[#d29922] border-[#9e6a03]",
  SOLD:      "bg-[#3d1f1f] text-[#f85149] border-[#da3633]",
} as const

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

type ProjectGroup = {
  id: string
  name: string
  location: string | null
  unitTypes: UnitType[]
}

export function InventoryList({ projects }: { projects: ProjectGroup[] }) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  const toggleType = (id: string) => {
    const next = new Set(expandedTypes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedTypes(next)
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div key={project.id} className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
          {/* Project Row */}
          <div className="px-4 py-3.5 border-b border-[#30363d] bg-[#1c2128]/50 flex items-center gap-3">
            <Building2 size={16} className="text-[#1f6feb]" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#e6edf3] truncate">{project.name}</h2>
              {project.location && <p className="text-[10px] text-[#7d8590] uppercase">{project.location}</p>}
            </div>
          </div>

          {/* Unit Types (Expandable) */}
          <div className="divide-y divide-[#21262d]">
            {project.unitTypes.map((type) => {
              const isExpanded = expandedTypes.has(type.id)
              const availableCount = type.units.filter(u => u.status === "AVAILABLE").length

              return (
                <div key={type.id} className="flex flex-col">
                  <div 
                    onClick={() => toggleType(type.id)}
                    className="px-4 py-3 flex items-center justify-between hover:bg-[#1c2128] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[#484f58] group-hover:text-[#e6edf3]">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers size={13} className="text-[#7d8590]" />
                        <span className="text-xs font-medium text-[#e6edf3]">{type.name}</span>
                        <span className="text-[10px] text-[#484f58] border border-[#21262d] px-1.5 py-0.5 rounded-full">
                          {type.units.length} total
                        </span>
                      </div>
                    </div>
                    {availableCount > 0 && (
                      <span className="text-[10px] text-[#3fb950] font-medium">
                        {availableCount} available
                      </span>
                    )}
                  </div>

                  {/* Units Grid */}
                  {isExpanded && (
                    <div className="px-4 py-4 bg-[#0d1117] border-t border-[#21262d]">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {type.units.map((unit) => (
                          <div key={unit.id} className="border border-[#30363d] rounded-md px-3 py-2 bg-[#161b22] space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Home size={11} className="text-[#484f58]" />
                              <span className="text-[11px] font-medium text-[#e6edf3] truncate">{unit.name}</span>
                            </div>
                            <span className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-tighter",
                              STATUS_STYLES[unit.status]
                            )}>
                              {unit.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}