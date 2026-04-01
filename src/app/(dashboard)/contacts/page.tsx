import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getContacts } from "@/actions/contacts"
import { AddContactModal } from "@/components/modals/AddContactModal"
import { Users, Search, ChevronRight } from "lucide-react"
import Link from "next/link"

type Props = {
  searchParams: Promise<{ search?: string; stage?: string; projectId?: string }>
}

const STAGE_STYLES = {
  GREEN:     { dot: "bg-[#3fb950]", badge: "bg-[#1a4f2a] text-[#3fb950] border-[#2ea043]",  label: "Green"     },
  AMBER:     { dot: "bg-[#d29922]", badge: "bg-[#4a3000] text-[#d29922] border-[#9e6a03]",  label: "Amber"     },
  CLOSED:    { dot: "bg-[#58a6ff]", badge: "bg-[#0d2a4a] text-[#58a6ff] border-[#1f6feb]",  label: "Closed"    },
  PAST:      { dot: "bg-[#a371f7]", badge: "bg-[#2d1f5e] text-[#a371f7] border-[#6e40c9]",  label: "Past"      },
  EXPIRED:   { dot: "bg-[#484f58]", badge: "bg-[#21262d] text-[#7d8590] border-[#30363d]",  label: "Expired"   },
  CANCELLED: { dot: "bg-[#f85149]", badge: "bg-[#3d1f1f] text-[#f85149] border-[#da3633]",  label: "Cancelled" },
} as const

type Stage = keyof typeof STAGE_STYLES

const STAGE_TABS = [
  { value: "ALL",       label: "All"       },
  { value: "GREEN",     label: "Green"     },
  { value: "AMBER",     label: "Amber"     },
  { value: "CLOSED",    label: "Closed"    },
  { value: "PAST",      label: "Past"      },
  { value: "EXPIRED",   label: "Expired"   },
  { value: "CANCELLED", label: "Cancelled" },
]

export default async function ContactsPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const params = await searchParams
  const search = params.search ?? ""
  const stage  = params.stage  ?? "ALL"
  const projectId = params.projectId ?? "ALL"

  const [allContacts, projects, agents, units] = await Promise.all([
    getContacts(search || undefined, stage),
    prisma.project.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where:   { isActive: true, deletedAt: null },
      select:  { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({
      where:  { status: "AVAILABLE" },
      select: {
        id:    true,
        name:  true,
        floor: true,
        unitType: { select: { name: true, projectId: true } },
      },
      orderBy: { name: "asc" },
    }),
  ])

  const contacts = projectId === "ALL" 
    ? allContacts 
    : allContacts.filter(c => c.projectId === projectId)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Contacts</h1>
          <p className="text-sm text-[#7d8590] mt-0.5">
            {contacts.length} lead{contacts.length !== 1 ? "s" : ""} in pipeline
          </p>
        </div>
        <AddContactModal projects={projects} agents={agents} units={units} />
      </div>

      {/* Filters Toolbar */}
      <div className="space-y-3">
        {/* Horizontal Scrollable Project Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <Link
            href={`/contacts?projectId=ALL&stage=${stage}${search ? `&search=${search}` : ""}`}
            className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              projectId === "ALL" ? "bg-[#21262d] border-[#484f58] text-[#e6edf3]" : "border-[#30363d] text-[#7d8590] hover:text-[#e6edf3]"
            }`}
          >
            All Projects
          </Link>
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/contacts?projectId=${p.id}&stage=${stage}${search ? `&search=${search}` : ""}`}
              className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                projectId === p.id ? "bg-[#21262d] border-[#484f58] text-[#e6edf3]" : "border-[#30363d] text-[#7d8590] hover:text-[#e6edf3]"
              }`}
            >
              {p.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Stage filter tabs (Scrollable on mobile) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {STAGE_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={`/contacts?stage=${tab.value}&projectId=${projectId}${search ? `&search=${search}` : ""}`}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  stage === tab.value ? "bg-[#21262d] border-[#484f58] text-[#e6edf3]" : "border-[#30363d] text-[#7d8590] hover:text-[#e6edf3]"
                }`}
              >
                {tab.value !== "ALL" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${STAGE_STYLES[tab.value as Stage]?.dot ?? "bg-[#484f58]"}`} />
                )}
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Search bar matching Finance UI */}
          <form method="GET" action="/contacts" className="relative w-full lg:w-72">
            <Search className="absolute left-2.5 top-2 text-[#7d8590]" size={14} />
            <input type="hidden" name="stage" value={stage} />
            <input type="hidden" name="projectId" value={projectId} />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or phone..."
              className="w-full h-8 pl-8 pr-3 text-sm bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#1f6feb] transition-colors"
            />
          </form>
        </div>
      </div>

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="border border-dashed border-[#30363d] rounded-lg py-20 text-center bg-[#161b22]/30">
          <Users size={32} className="mx-auto text-[#484f58] mb-3" />
          <p className="text-sm font-medium text-[#7d8590]">No leads found matching these criteria</p>
        </div>
      ) : (
        <div className="border border-[#30363d] rounded-lg overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px_110px] gap-4 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
            <span className="text-xs font-medium text-[#7d8590]">Contact</span>
            <span className="text-xs font-medium text-[#7d8590]">Project</span>
            <span className="text-xs font-medium text-[#7d8590]">Agent</span>
            <span className="text-xs font-medium text-[#7d8590]">Unit</span>
            <span className="text-xs font-medium text-[#7d8590]">Stage</span>
          </div>

          <div className="divide-y divide-[#21262d]">
            {contacts.map((contact) => {
              const opp = contact.opportunity
              const stageKey = (opp?.stage ?? "GREEN") as Stage
              const style = STAGE_STYLES[stageKey]
              
              return (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="flex flex-col md:grid md:grid-cols-[1fr_140px_140px_120px_110px] gap-2 md:gap-4 px-4 py-3.5 bg-[#0d1117] hover:bg-[#161b22] transition-colors group relative"
                >
                  {/* Contact Primary Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <p className="text-xs font-semibold text-[#58a6ff] group-hover:underline truncate transition-colors">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-[10px] text-[#7d8590] mt-0.5">{contact.phone}</p>
                      {/* Mobile-only sub-info */}
                      <p className="md:hidden text-[10px] text-[#484f58] mt-1 truncate">
                        {contact.project.name} · {opp?.unit?.name ?? "No Unit"}
                      </p>
                    </div>
                  </div>

                  {/* Desktop Only Columns */}
                  <div className="hidden md:flex items-center text-xs text-[#e6edf3] truncate">{contact.project.name}</div>
                  <div className="hidden md:flex items-center text-xs text-[#7d8590] truncate">{contact.agent.name}</div>
                  <div className="hidden md:flex items-center text-xs text-[#7d8590] truncate">
                    {opp?.unit?.name ?? <span className="text-[#484f58] italic">Unassigned</span>}
                  </div>

                  {/* Stage Badge - Sticky to right on mobile */}
                  <div className="flex items-center absolute right-4 top-1/2 -translate-y-1/2 md:static md:translate-y-0">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${style.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {style.label}
                    </span>
                    <ChevronRight size={14} className="ml-2 text-[#30363d] md:hidden" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}