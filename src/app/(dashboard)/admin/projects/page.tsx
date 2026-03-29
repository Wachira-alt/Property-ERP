import { getProjects } from "@/actions/inventory"
import { getSession } from "@/lib/auth"
import { canPerform } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { AddProjectModal } from "@/components/modals/AddProjectModal"
import { AddUnitTypeModal } from "@/components/modals/AddUnitTypeModal"
import { AddUnitModal } from "@/components/modals/AddUnitModal"
import { Badge } from "@/components/ui/badge"
import { Building2, Layers, Home } from "lucide-react"

const STATUS_STYLES = {
  AVAILABLE: "bg-[#1a4f2a] text-[#3fb950] border-[#2ea043]",
  RESERVED:  "bg-[#4a3000] text-[#d29922] border-[#9e6a03]",
  SOLD:      "bg-[#3d1f1f] text-[#f85149] border-[#da3633]",
} as const

export default async function ProjectsPage() {
  const session = await getSession()
  if (!session || !canPerform(session.role, "MANAGE_INVENTORY")) {
    redirect("/contacts")
  }

  const projects = await getProjects()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Projects</h1>
          <p className="text-sm text-[#7d8590] mt-0.5">
            Manage developments, unit types, and individual units
          </p>
        </div>
        <AddProjectModal />
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="border border-dashed border-[#30363d] rounded-lg py-16 text-center">
          <Building2 size={32} className="mx-auto text-[#484f58] mb-3" />
          <p className="text-sm font-medium text-[#e6edf3]">No projects yet</p>
          <p className="text-xs text-[#7d8590] mt-1">
            Create your first project to start adding units
          </p>
        </div>
      )}

      {/* Projects list */}
      <div className="space-y-4">
        {projects.map((project) => {
          const totalUnits = project.unitTypes.reduce(
            (acc, ut) => acc + ut.units.length, 0
          )
          const available = project.unitTypes.reduce(
            (acc, ut) => acc + ut.units.filter((u) => u.status === "AVAILABLE").length, 0
          )
          const reserved = project.unitTypes.reduce(
            (acc, ut) => acc + ut.units.filter((u) => u.status === "RESERVED").length, 0
          )
          const sold = project.unitTypes.reduce(
            (acc, ut) => acc + ut.units.filter((u) => u.status === "SOLD").length, 0
          )

          return (
            <div
              key={project.id}
              className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden"
            >
              {/* Project header */}
              <div className="px-5 py-4 border-b border-[#30363d] flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-[#1f6feb1a] border border-[#1f6feb33] flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 size={15} className="text-[#1f6feb]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-[#e6edf3] truncate">
                      {project.name}
                    </h2>
                    {project.location && (
                      <p className="text-xs text-[#7d8590] mt-0.5">{project.location}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-3 text-xs text-[#7d8590]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
                      {available} available
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#d29922]" />
                      {reserved} reserved
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#f85149]" />
                      {sold} sold
                    </span>
                  </div>
                  <AddUnitTypeModal
                    projectId={project.id}
                    projectName={project.name}
                  />
                </div>
              </div>

              {/* Unit types */}
              {project.unitTypes.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-[#7d8590]">
                    No unit types yet. Add one to start creating units.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#21262d]">
                  {project.unitTypes.map((unitType) => (
                    <div key={unitType.id} className="px-5 py-4">
                      {/* Unit type header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Layers size={13} className="text-[#7d8590]" />
                          <span className="text-xs font-medium text-[#e6edf3]">
                            {unitType.name}
                          </span>
                          <span className="text-xs text-[#484f58]">
                            {unitType.units.length} unit{unitType.units.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <AddUnitModal
                          unitTypeId={unitType.id}
                          unitTypeName={`${project.name} — ${unitType.name}`}
                        />
                      </div>

                      {/* Units grid */}
                      {unitType.units.length === 0 ? (
                        <p className="text-xs text-[#484f58] pl-5">
                          No units yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {unitType.units.map((unit) => (
                            <div
                              key={unit.id}
                              className="border border-[#30363d] rounded-md px-3 py-2.5 bg-[#0d1117] space-y-1.5"
                            >
                              <div className="flex items-center gap-1.5">
                                <Home size={11} className="text-[#484f58]" />
                                <span className="text-xs font-medium text-[#e6edf3] truncate">
                                  {unit.name}
                                </span>
                              </div>
                              {unit.floor && (
                                <p className="text-[10px] text-[#484f58]">
                                  {unit.floor} floor
                                </p>
                              )}
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${STATUS_STYLES[unit.status]}`}
                              >
                                {unit.status.charAt(0) + unit.status.slice(1).toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Project footer */}
              <div className="px-5 py-2.5 bg-[#0d1117] border-t border-[#21262d] flex items-center gap-1 text-[#484f58]">
                <span className="text-[11px]">{totalUnits} total units</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}