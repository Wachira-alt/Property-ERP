import { formatDateTime } from "@/lib/utils"
import { Send, Clock } from "lucide-react"

type Campaign = {
  id:        string
  subject:   string
  body:      string
  sentAt:    Date | null
  createdAt: Date
}

type Props = {
  campaigns: Campaign[]
}

export function CampaignHistory({ campaigns }: Props) {
  if (campaigns.length === 0) {
    return (
      <div className="border border-dashed border-[#30363d] rounded-lg py-12 text-center">
        <Send size={24} className="mx-auto text-[#484f58] mb-3" />
        <p className="text-sm font-medium text-[#e6edf3]">No campaigns sent yet</p>
        <p className="text-xs text-[#7d8590] mt-1">
          Campaigns you send will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden"
        >
          <div className="px-4 py-3 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#e6edf3] truncate">
                {campaign.subject}
              </p>
              <div className="flex items-center gap-3 mt-1">
                {campaign.sentAt ? (
                  <span className="flex items-center gap-1 text-[11px] text-[#3fb950]">
                    <Send size={10} />
                    Sent {formatDateTime(campaign.sentAt)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-[#d29922]">
                    <Clock size={10} />
                    Draft — not sent
                  </span>
                )}
              </div>
            </div>

            <span
              className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded border ${
                campaign.sentAt
                  ? "bg-[#1a4f2a] text-[#3fb950] border-[#2ea043]"
                  : "bg-[#4a3000] text-[#d29922] border-[#9e6a03]"
              }`}
            >
              {campaign.sentAt ? "Sent" : "Draft"}
            </span>
          </div>

          {/* Body preview */}
          <div className="px-4 py-3 border-t border-[#21262d] bg-[#0d1117]">
            <p className="text-xs text-[#484f58] line-clamp-2 whitespace-pre-line">
              {campaign.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}