// @ts-nocheck
"use client"

import { formatDateTime } from "@/lib/utils"
import { Send, Users, Paperclip, ChevronDown, ChevronUp, Trash2, Loader2, Download } from "lucide-react"
import { useState, useTransition } from "react"
import { deleteCampaign } from "@/actions/marketing"
import { toast } from "sonner"

type Attachment = {
  id:       string
  fileName: string
  fileUrl?:  string
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

type Props = {
  campaigns:  Campaign[]
  canDelete?: boolean
}

const AUDIENCE_LABELS: Record<string, string> = {
  ALL:    "All contacts",
  GREEN:  "Leads",
  AMBER:  "Reservations",
  CLOSED: "Paying clients",
  PAST:   "Past clients",
}

export function CampaignHistory({ campaigns, canDelete = false }: Props) {
  const [expanded, setExpanded]      = useState<string | null>(null)
  const [deleting, setDeleting]      = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm("Delete this campaign? This cannot be undone.")) return
    setDeleting(id)
    startTransition(async () => {
      const result = await deleteCampaign(id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Campaign deleted")
        if (expanded === id) setExpanded(null)
      }
      setDeleting(null)
    })
  }

  if (campaigns.length === 0) {
    return (
      <div className="border border-dashed border-[#30363d] rounded-lg py-12 text-center">
        <Send size={24} className="mx-auto text-[#484f58] mb-3" />
        <p className="text-sm font-medium text-[#e6edf3]">No campaigns yet</p>
        <p className="text-xs text-[#7d8590] mt-1">Campaigns you send will appear here</p>
      </div>
    )
  }

  return (
    <div className="border border-[#30363d] rounded-lg overflow-hidden divide-y divide-[#21262d]">
      {campaigns.map((campaign) => {
        const isOpen = expanded === campaign.id

        return (
          <div key={campaign.id}>

            {/* ── Row ── */}
            <div
              className="px-4 py-3 flex items-center gap-3 hover:bg-[#1c2128] transition-colors cursor-pointer select-none bg-[#161b22]"
              onClick={() => toggle(campaign.id)}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                campaign.sentAt ? "bg-[#3fb950]" : "bg-[#d29922]"
              }`} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[#e6edf3] truncate">{campaign.subject}</p>
                  {campaign.attachments.length > 0 && (
                    <Paperclip size={11} className="text-[#484f58] shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-[#7d8590]">
                    {AUDIENCE_LABELS[campaign.audience] ?? campaign.audience}
                  </span>
                  {campaign.sentAt ? (
                    <>
                      <span className="text-[#484f58] text-[11px]">·</span>
                      <span className="flex items-center gap-1 text-[11px] text-[#7d8590]">
                        <Users size={10} />
                        {campaign.sentCount} recipients
                      </span>
                      <span className="text-[#484f58] text-[11px]">·</span>
                      <span className="text-[11px] text-[#484f58]">
                        {formatDateTime(campaign.sentAt)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#484f58] text-[11px]">·</span>
                      <span className="text-[11px] text-[#d29922]">Draft</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canDelete && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, campaign.id)}
                    disabled={deleting === campaign.id}
                    className="p-1.5 rounded text-[#484f58] hover:text-[#f85149] hover:bg-[#21262d] transition-colors disabled:opacity-50"
                    title="Delete campaign"
                  >
                    {deleting === campaign.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                )}
                {isOpen
                  ? <ChevronUp size={14} className="text-[#484f58]" />
                  : <ChevronDown size={14} className="text-[#484f58]" />
                }
              </div>
            </div>

            {/* ── Expanded preview ── */}
            {isOpen && (
              <div className="bg-[#0d1117] border-t border-[#21262d]">

                {/* Email header strip */}
                <div className="px-4 py-3 border-b border-[#21262d] space-y-1.5">
                  <MetaRow label="From"    value={process.env.NEXT_PUBLIC_GMAIL_USER ?? "campaigns@lifestyleestates.co.ke"} />
                  <MetaRow label="To"      value={`${AUDIENCE_LABELS[campaign.audience] ?? campaign.audience} — ${campaign.sentCount} recipients`} />
                  <MetaRow label="Subject" value={campaign.subject} highlight />
                  {campaign.sentAt && (
                    <MetaRow label="Sent" value={formatDateTime(campaign.sentAt)} />
                  )}
                </div>

                {/* Attachments — clickable chips */}
                {campaign.attachments.length > 0 && (
                  <div className="px-4 py-3 border-b border-[#21262d]">
                    <p className="text-[10px] text-[#484f58] uppercase tracking-wider mb-2">
                      Attachments ({campaign.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.attachments.map((a) => (
                        a.fileUrl ? (
                          <a
                            key={a.id}
                            href={a.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded-md hover:border-[#484f58] hover:text-[#e6edf3] transition-colors group"
                          >
                            <Download size={10} className="text-[#484f58] group-hover:text-[#58a6ff]" />
                            <span className="text-[11px] text-[#7d8590] group-hover:text-[#e6edf3]">{a.fileName}</span>
                          </a>
                        ) : (
                          <div
                            key={a.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded-md"
                          >
                            <Paperclip size={10} className="text-[#484f58]" />
                            <span className="text-[11px] text-[#484f58]">{a.fileName}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Email body — GitHub dark themed */}
                <div className="p-4">
                  <div className="border border-[#30363d] rounded-lg overflow-hidden">
                    {/* Mock email client header */}
                    <div className="px-4 py-2 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f85149] opacity-60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#d29922] opacity-60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#3fb950] opacity-60" />
                      <span className="ml-2 text-[10px] text-[#484f58]">Email preview</span>
                    </div>
                    {/* Body in white — email clients render white bg */}
                    <div className="bg-[#f6f8fa]">
                      <div
                        className="max-w-2xl mx-auto text-[#1a1a1a] text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: campaign.body }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MetaRow({ label, value, highlight = false }: {
  label:      string
  value:      string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-[#484f58] w-14 shrink-0">{label}</span>
      <span className={highlight ? "text-[#e6edf3] font-medium" : "text-[#7d8590]"}>{value}</span>
    </div>
  )
}