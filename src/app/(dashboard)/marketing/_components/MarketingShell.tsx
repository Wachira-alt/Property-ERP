// @ts-nocheck
"use client"

import { useState } from "react"
import { PenSquare, Users, Mail, Inbox } from "lucide-react"
import { CampaignBuilder } from "./CampaignBuilder"
import { CampaignHistory } from "./CampaignHistory"

type Attachment = {
  id:       string
  fileName: string
}

type Campaign = {
  id:          string
  subject:     string
  body:        string
  audience:    string
  sentAt:      Date | null
  sentCount:   number
  createdAt:   Date
  attachments: Attachment[]
}

type Stats = {
  totalSent:       number
  totalRecipients: number
  totalDrafts:     number
}

type Props = {
  campaigns:  Campaign[]
  canDelete?: boolean
  stats:      Stats
}

type Tab = "history" | "compose"

export function MarketingShell({ campaigns, stats, canDelete = false }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("history")

  return (
    <div className="flex flex-col">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-[#e6edf3]">Marketing</h1>
          <p className="text-xs text-[#7d8590] mt-0.5">Send targeted campaigns to your contacts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatPill icon={<Mail size={11} />}  label="Sent"     value={stats.totalSent} />
          <StatPill icon={<Users size={11} />} label="Reached"  value={stats.totalRecipients} />
          {stats.totalDrafts > 0 && (
            <StatPill icon={<PenSquare size={11} />} label="Drafts" value={stats.totalDrafts} muted />
          )}
        </div>
      </div>

      {/* ── Tabs — same on mobile and desktop ── */}
      <div className="border border-[#30363d] rounded-lg overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-[#30363d] bg-[#161b22]">
          <Tab
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={<Inbox size={13} />}
            label="Campaigns"
            count={campaigns.length}
          />
          <Tab
            active={activeTab === "compose"}
            onClick={() => setActiveTab("compose")}
            icon={<PenSquare size={13} />}
            label="New campaign"
          />
        </div>

        {/* Tab content */}
        <div className="bg-[#0d1117]">
          {activeTab === "history" ? (
            <div className="p-4">
              <CampaignHistory campaigns={campaigns} canDelete={canDelete} />
            </div>
          ) : (
            <div className="p-4">
              <CampaignBuilder onSent={() => setActiveTab("history")} />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function Tab({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active:  boolean
  onClick: () => void
  icon:    React.ReactNode
  label:   string
  count?:  number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
        active
          ? "border-[#1f6feb] text-[#e6edf3] bg-[#161b22]"
          : "border-transparent text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#1c2128]"
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          active
            ? "bg-[#1f6feb22] text-[#58a6ff]"
            : "bg-[#21262d] text-[#484f58]"
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  muted = false,
}: {
  icon:   React.ReactNode
  label:  string
  value:  number
  muted?: boolean
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] ${
      muted
        ? "bg-[#161b22] border-[#30363d] text-[#484f58]"
        : "bg-[#161b22] border-[#30363d] text-[#7d8590]"
    }`}>
      <span className="text-[#484f58]">{icon}</span>
      <span className="font-semibold text-[#e6edf3]">{value}</span>
      <span>{label}</span>
    </div>
  )
}