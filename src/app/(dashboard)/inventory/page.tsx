import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Home, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_STYLES = {
  AVAILABLE: "bg-[#1a4f2a] text-[#3fb950] border-[#2ea043]",
  RESERVED: "bg-[#4a3000] text-[#d29922] border-[#9e6a03]",
  SOLD: "bg-[#3d1f1f] text-[#f85149] border-[#da3633]",
} as const

type FilterStatus = "ALL" | "AVAILABLE" | "RESERVED" | "SOLD"

type Props = {
  searchParams: Promise<{ project?: string; status?: string }>
}

function buildHref(project: string, status: FilterStatus) {
  const p = new URLSearchParams()
  if (project !== "ALL") p.set("project", project)
  if (status !== "ALL") p.set("status", status)
  const q = p.toString()
  return `/inventory${q ? "?" + q : ""}`
}

function ProjectPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  const cls = cn(
    "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors",
    active ? "bg-[#1f6feb] border-[#1f6feb] text-white" : "border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] hover:border-[#484f58]"
  )
  return <a href={href} className={cls}>{label}</a>
}

function StatusPill({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  const cls = cn(
    "text-xs px-3 py-1.5 rounded-md border transition-colors",
    active ? "bg-[#21262d] border-[#484f58] text-[#e6edf3]" : "border-[#30363d] text-[#7d8590] hover:text-[#e6edf3]"
  )
  return (
    <a href={href} className={cls}>
      {label}
      <span className="ml-1.5 text-[#484f58]">{count}</span>
    </a>
  )
}

export default async function InventoryPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const params = await searchParams
  const selectedProject = params.project ?? "ALL"
  const selectedStatus = (params.status as FilterStatus) ?? "ALL"

  const [projects, units] = await Promise.all([
    prisma.project.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({
      where: {
        ...(selectedStatus !== "ALL" && { status: selectedStatus }),
        ...(selectedProject !== "ALL" && { unitType: { projectId: selectedProject } }),
      },
      include: {
        unitType: {
          include: { project: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ unitType: { project: { name: "asc" } } }, { name: "asc" }],
    }),
  ])

  const counts = {
    ALL: units.length,
    AVAILABLE: units.filter((u) => u.status === "AVAILABLE").length,
    RESERVED: units.filter((u) => u.status === "RESERVED").length,
    SOLD: units.filter((u) => u.status === "SOLD").length,
  }

  const statuses: FilterStatus[] = ["ALL", "AVAILABLE", "RESERVED", "SOLD"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Inventory</h1>
        <p className="text-sm text-[#7d8590] mt-0.5">All units across all projects</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <ProjectPill href="/inventory" active={selectedProject === "ALL"} label="All projects" />
          {projects.map((p) => (
            <ProjectPill key={p.id} href={buildHref(p.id, selectedStatus)} active={selectedProject === p.id} label={p.name} />
          ))}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {statuses.map((s) => (
            <StatusPill
              key={s}
              href={buildHref(selectedProject, s)}
              active={selectedStatus === s}
              label={s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              count={counts[s]}
            />
          ))}
        </div>
      </div>

      {units.length === 0 && (
        <div className="border border-dashed border-[#30363d] rounded-lg py-16 text-center">
          <Home size={32} className="mx-auto text-[#484f58] mb-3" />
          <p className="text-sm font-medium text-[#e6edf3]">No units found</p>
          <p className="text-xs text-[#7d8590] mt-1">Try adjusting your filters or add units in Projects</p>
        </div>
      )}

      {units.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {units.map((unit) => (
            <div key={unit.id} className="border border-[#30363d] rounded-lg bg-[#161b22] p-3 space-y-2.5 hover:border-[#484f58] transition-colors">
              <div className="flex items-center gap-1.5 min-w-0">
                <Home size={12} className="text-[#484f58] shrink-0" />
                <span className="text-xs font-semibold text-[#e6edf3] truncate">{unit.name}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Building2 size={10} className="text-[#484f58]" />
                  <span className="text-[10px] text-[#7d8590] truncate">{unit.unitType.project.name}</span>
                </div>
                <p className="text-[10px] text-[#484f58]">{unit.unitType.name}</p>
                {unit.floor && <p className="text-[10px] text-[#484f58]">{unit.floor} floor</p>}
              </div>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${STATUS_STYLES[unit.status]}`}>
                {unit.status.charAt(0) + unit.status.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}