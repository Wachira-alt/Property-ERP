"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, ExternalLink, Search, Users } from "lucide-react"
import Link from "next/link"

type TeamMember = {
  id: string
  name: string
  role: string
  total: number
  green: number
  amber: number
  closed: number
  past: number
  conversion: number
}

const ROLE_LABELS: Record<string, string> = {
  GENERAL_MANAGER: "General Manager",
  ADMIN: "Admin",
  AGENT: "Agent",
  SENIOR_AGENT: "Senior Agent",
  JUNIOR_AGENT: "Junior Agent",
}

export function TeamPerformanceTable({ team }: { team: TeamMember[] }) {
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return team
      .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.closed + b.past) - (a.closed + a.past))
  }, [team, search])

  return (
    <div className="flex flex-col w-full">

      {/* ── Search Header ── */}
      <div className="px-5 py-2.5 border-b border-[#21262d] flex items-center justify-between gap-3 bg-[#0d1117]/20">
        <div className="relative w-48 sm:w-64">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#484f58]" />
          <input
            placeholder="Filter agents..."
            className="bg-[#0d1117] border border-[#30363d] rounded-md text-[12px] pl-8 pr-3 py-1 focus:ring-1 focus:ring-[#58a6ff] focus:border-transparent text-[#e6edf3] w-full placeholder:text-[#484f58] outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[#21262d] bg-[#0d1117]/40">
          <Users size={11} className="text-[#484f58]" />
          <span className="text-[11px] text-[#484f58] font-mono whitespace-nowrap">{filtered.length} members</span>
        </div>
      </div>

      {/* ── Rows ── */}
      <div className="divide-y divide-[#21262d]">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[#484f58]">No agents match your search</div>
        ) : (
          filtered.map((member, index) => (
            <AgentRow
              key={member.id}
              member={member}
              rank={index + 1}
              isExpanded={expandedId === member.id}
              onToggle={() => setExpandedId(expandedId === member.id ? null : member.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function AgentRow({
  member,
  rank,
  isExpanded,
  onToggle,
}: {
  member: TeamMember
  rank: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const getPct = (val: number) => (member.total > 0 ? (val / member.total) * 100 : 0)
  const initials = member.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
  const displayRole = ROLE_LABELS[member.role] ?? member.role.replace(/_/g, " ").toLowerCase()

  const rankStyles: Record<number, string> = {
    1: "text-[#d29922] border-[#d2992240] bg-[#d2992215]",
    2: "text-[#8b949e] border-[#8b949e30] bg-[#8b949e10]",
    3: "text-[#c78764] border-[#c7876430] bg-[#c7876410]",
  }
  const rankStyle = rankStyles[rank] ?? "text-[#484f58] border-[#30363d] bg-transparent"

  const convStyle =
    member.total === 0
      ? "text-[#484f58] border-[#21262d] bg-transparent"
      : member.conversion >= 25
      ? "text-[#3fb950] border-[#2ea04333] bg-[#2ea04311]"
      : member.conversion >= 12
      ? "text-[#d29922] border-[#9e6a0333] bg-[#d2992211]"
      : "text-[#f85149] border-[#da363333] bg-[#f8514911]"

  const convLabel = member.total === 0 ? "—" : `${member.conversion}%`

  return (
    <div
      className={cn(
        "border-l-2 border-transparent transition-colors duration-150",
        isExpanded ? "bg-[#0d1117]/50 border-l-[#58a6ff]" : "hover:bg-[#1c2128]"
      )}
    >
      {/* ── Row Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer gap-3"
        onClick={onToggle}
      >
        {/* Left: chevron + avatar + name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <ChevronRight
            size={13}
            className={cn(
              "text-[#484f58] transition-transform duration-200 shrink-0",
              isExpanded && "rotate-90 text-[#58a6ff]"
            )}
          />
          <div className="w-7 h-7 rounded-full bg-[#1c2128] border border-[#30363d] flex items-center justify-center text-[10px] font-semibold text-[#7d8590] shrink-0 tracking-wide">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#e6edf3] truncate leading-snug">{member.name}</p>
            <p className="text-[10px] text-[#484f58] leading-snug capitalize">{displayRole}</p>
          </div>
        </div>

        {/* Right: leads + rank + conversion */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-mono text-[#484f58] hidden sm:block">
            {member.total} <span className="text-[9px] uppercase tracking-wide">leads</span>
          </span>

          {/* Rank badge — text only, no icon */}
          {/* <span className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold font-mono border leading-none",
            rankStyle
          )}>
            {rank}
          </span> */}

          {/* Conversion badge */}
          <span className={cn(
            "text-[11px] font-mono font-bold px-2 py-0.5 rounded border leading-none",
            convStyle
          )}>
            {convLabel}
          </span>
        </div>
      </div>

      {/* ── Expanded Detail ── */}
      {isExpanded && (
        <div className="px-5 sm:pl-[52px] pb-5 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">

          {/* Label row */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#484f58] uppercase tracking-widest">
              Pipeline breakdown
            </span>
            <Link
              href={`/contacts?agentId=${member.id}`}
              className="text-[10px] text-[#58a6ff] flex items-center gap-1 hover:underline"
            >
              View contacts <ExternalLink size={10} />
            </Link>
          </div>

          {/* Stacked progress bar — gap-px so thin segments are visible */}
          <div className="h-1.5 w-full bg-[#21262d] rounded-full overflow-hidden flex gap-px mb-4">
            <div className="h-full bg-[#3fb950] rounded-l-full" style={{ width: `${getPct(member.green)}%` }} />
            <div className="h-full bg-[#d29922]"               style={{ width: `${getPct(member.amber)}%` }} />
            <div className="h-full bg-[#58a6ff]"               style={{ width: `${getPct(member.closed)}%` }} />
            <div className="h-full bg-[#a371f7] rounded-r-full" style={{ width: `${getPct(member.past)}%` }} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-4 gap-x-2 border-t border-[#21262d] pt-4">
            <StatBox label="Green"      value={member.green}  color="text-[#3fb950]" dot="#3fb950" />
            <StatBox label="Amber"      value={member.amber}  color="text-[#d29922]" dot="#d29922" />
            <StatBox label="Closed"     value={member.closed} color="text-[#58a6ff]" dot="#58a6ff" />
            <StatBox label="Fully paid" value={member.past}   color="text-[#a371f7]" dot="#a371f7" />
            <StatBox
              label="Efficiency"
              value={member.total === 0 ? "—" : `${member.conversion}%`}
              color={
                member.total === 0     ? "text-[#484f58]" :
                member.conversion >= 25 ? "text-[#3fb950]" :
                member.conversion >= 12 ? "text-[#d29922]" :
                "text-[#f85149]"
              }
              className="col-span-2 sm:col-span-1 border-t sm:border-none pt-3 sm:pt-0"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
  dot,
  className,
}: {
  label: string
  value: string | number
  color: string
  dot?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[9px] text-[#484f58] uppercase font-bold tracking-tight flex items-center gap-1">
        {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />}
        {label}
      </span>
      <span className={cn("text-[13px] font-mono font-semibold", color)}>{value}</span>
    </div>
  )
}