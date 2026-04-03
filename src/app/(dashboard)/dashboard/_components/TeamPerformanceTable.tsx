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

export function TeamPerformanceTable({ team }: { team: TeamMember[] }) {
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return team
      .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.closed + b.past) - (a.closed + a.past))
  }, [team, search])

  return (
    <div className="flex flex-col w-full bg-[#161b22]">
      {/* ── Search Header ────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[#30363d] flex flex-col sm:flex-row sm:items-center gap-3 bg-[#0d1117]/30">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484f58]" />
          <input
            placeholder="Filter agents..."
            className="bg-[#0d1117] border border-[#30363d] rounded-md text-sm pl-9 pr-4 py-1.5 focus:ring-1 focus:ring-[#58a6ff] focus:border-transparent text-[#e6edf3] w-full placeholder:text-[#484f58]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#30363d] bg-[#0d1117]">
            <Users size={12} className="text-[#7d8590]" />
            <span className="text-[11px] text-[#7d8590] font-mono whitespace-nowrap">{filtered.length} members</span>
          </div>
        </div>
      </div>

      {/* ── Rows ─────────────────────────────────────────────────────── */}
      <div className="divide-y divide-[#21262d]">
        {filtered.map((member) => (
          <AgentRow
            key={member.id}
            member={member}
            isExpanded={expandedId === member.id}
            onToggle={() => setExpandedId(expandedId === member.id ? null : member.id)}
          />
        ))}
      </div>
    </div>
  )
}

function AgentRow({ member, isExpanded, onToggle }: { member: TeamMember, isExpanded: boolean, onToggle: () => void }) {
  const getPct = (val: number) => (member.total > 0 ? (val / member.total) * 100 : 0)

  return (
    <div className={cn(
      "transition-all duration-200 border-l-2 border-transparent",
      isExpanded ? "bg-[#0d1117] border-l-[#58a6ff]" : "hover:bg-[#1c2128]"
    )}>
      {/* ── Header Row ─────────────────────────────────────────────── */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronRight 
            size={16} 
            className={cn("text-[#484f58] transition-transform duration-200", isExpanded && "rotate-90 text-[#58a6ff]")} 
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate">
            <span className="text-[13px] font-medium text-[#e6edf3] truncate">{member.name}</span>
            <span className="text-[10px] text-[#484f58] uppercase tracking-wider">{member.role.toLowerCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          <div className="text-[11px] font-mono text-[#7d8590] hidden xs:block">
            {member.total} <span className="text-[9px] text-[#484f58] uppercase">Leads</span>
          </div>
          <div className={cn(
            "text-[11px] font-mono font-bold px-2 py-0.5 rounded border leading-none",
            member.conversion >= 25 ? "text-[#3fb950] border-[#2ea04333] bg-[#2ea04311]" : 
            member.conversion >= 12 ? "text-[#d29922] border-[#9e6a0333] bg-[#d2992211]" : 
            "text-[#f85149] border-[#da363333] bg-[#f8514911]"
          )}>
            {member.conversion}%
          </div>
        </div>
      </div>

      {/* ── Expanded Content ───────────────────────────────────────── */}
      {isExpanded && (
        <div className="px-4 sm:px-11 pb-5 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Progress Bar Labeling */}
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] font-bold text-[#484f58] uppercase tracking-widest">Pipeline Health</span>
             <Link 
                href={`/contacts?agentId=${member.id}`}
                className="text-[10px] text-[#58a6ff] flex items-center gap-1 hover:underline"
              >
                Full Details <ExternalLink size={10} />
              </Link>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-[#21262d] rounded-full overflow-hidden flex gap-px mb-4">
            <div className="h-full bg-[#3fb950]" style={{ width: `${getPct(member.green)}%` }} />
            <div className="h-full bg-[#d29922]" style={{ width: `${getPct(member.amber)}%` }} />
            <div className="h-full bg-[#58a6ff]" style={{ width: `${getPct(member.closed)}%` }} />
            <div className="h-full bg-[#a371f7]" style={{ width: `${getPct(member.past)}%` }} />
          </div>

          {/* Grid of Stats - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-4 gap-x-2 border-t border-[#21262d] pt-4">
            <MetricBox label="Green" value={member.green} color="text-[#3fb950]" />
            <MetricBox label="Amber" value={member.amber} color="text-[#d29922]" />
            <MetricBox label="Closed" value={member.closed} color="text-[#58a6ff]" />
            <MetricBox label="Past" value={member.past} color="text-[#a371f7]" />
            <MetricBox label="Efficiency" value={`${member.conversion}%`} color="text-[#e6edf3]" className="col-span-2 sm:col-span-1 border-t sm:border-none pt-3 sm:pt-0" />
          </div>
        </div>
      )}
    </div>
  )
}

function MetricBox({ label, value, color, className }: { label: string, value: string | number, color: string, className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[9px] text-[#484f58] uppercase font-bold tracking-tight">
        {label}
      </span>
      <span className={cn("text-sm font-mono font-semibold", color)}>
        {value}
      </span>
    </div>
  )
}