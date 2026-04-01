"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createCampaign, sendCampaign, getAudienceCount } from "@/actions/marketing"
import { Send, Users } from "lucide-react"

const AUDIENCE_OPTIONS = [
  { value: "ALL",    label: "All contacts",         desc: "Everyone with an email" },
  { value: "GREEN",  label: "Green — Leads",        desc: "Active leads not yet reserved" },
  { value: "AMBER",  label: "Amber — Reservations", desc: "Contacts with active reservations" },
  { value: "CLOSED", label: "Closed — Paying",      desc: "Contacts making payments" },
  { value: "PAST",   label: "Past — Completed",     desc: "Fully paid clients" },
]

export function CampaignBuilder() {
  const [subject, setSubject]   = useState("")
  const [body, setBody]         = useState("")
  const [audience, setAudience] = useState("ALL")
  const [count, setCount]       = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  // Fetch audience count whenever audience changes
  useEffect(() => {
    setCount(null)
    getAudienceCount(audience).then(setCount)
  }, [audience])

  function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message body are required")
      return
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set("subject",  subject.trim())
      fd.set("body",     body.trim())
      fd.set("audience", audience)

      const created = await createCampaign(fd)

      if (created?.error) {
        toast.error(created.error)
        return
      }

      if (!created.campaignId) {
        toast.error("Failed to create campaign")
        return
      }

      const sent = await sendCampaign(created.campaignId, audience)

      if (sent?.error) {
        toast.error(sent.error)
      } else {
        toast.success(`Campaign sent to ${sent.sent} recipient${sent.sent !== 1 ? "s" : ""}`)
        setSubject("")
        setBody("")
        setAudience("ALL")
      }
    })
  }

  const selectedAudience = AUDIENCE_OPTIONS.find((a) => a.value === audience)

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#30363d]">
        <h2 className="text-sm font-medium text-[#e6edf3]">New campaign</h2>
        <p className="text-xs text-[#7d8590] mt-0.5">
          Send a message to a segment of your contacts
        </p>
      </div>

      <form onSubmit={handleSend} className="p-5 space-y-4">
        {/* Audience */}
        <div className="space-y-1.5">
          <Label className="text-[#e6edf3] text-xs">
            Audience <span className="text-[#f85149]">*</span>
          </Label>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] focus:ring-[#1f6feb]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-[#30363d]">
              {AUDIENCE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                >
                  <div>
                    <span className="font-medium">{opt.label}</span>
                    <span className="ml-2 text-[#484f58] text-xs">{opt.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Audience count */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <Users size={11} className="text-[#484f58]" />
            {count === null ? (
              <span className="text-[#484f58]">Counting…</span>
            ) : (
              <span className="text-[#7d8590]">
                <span className="text-[#e6edf3] font-medium">{count}</span>{" "}
                recipient{count !== 1 ? "s" : ""} with email addresses
              </span>
            )}
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <Label className="text-[#e6edf3] text-xs">
            Subject line <span className="text-[#f85149]">*</span>
          </Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="e.g. Important update about your unit"
            className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-[#1f6feb] focus-visible:border-[#1f6feb]"
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[#e6edf3] text-xs">
              Message <span className="text-[#f85149]">*</span>
            </Label>
            <span className="text-[10px] text-[#484f58]">
              Use {`{{name}}`} for first name
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            placeholder={`Dear {{name}},\n\nYour message here…`}
            className="w-full px-3 py-2.5 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#1f6feb] resize-none font-mono"
          />
          <p className="text-[10px] text-[#484f58]">
            Plain text or HTML. Variables: {`{{name}}`}, {`{{firstName}}`}, {`{{lastName}}`}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-[#d29922]">
            This will send immediately to all recipients. Cannot be undone.
          </p>
          <Button
            type="submit"
            disabled={isPending || !subject.trim() || !body.trim() || count === 0}
            className="gap-2"
          >
            <Send size={13} />
            {isPending ? "Sending…" : `Send campaign`}
          </Button>
        </div>
      </form>
    </div>
  )
}