"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
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
import { RichEditor } from "./RichEditor"
import { createCampaign, sendCampaign, getAudienceCount } from "@/actions/marketing"
import {
  Send,
  Users,
  Paperclip,
  X,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { useDropzone } from "react-dropzone"

const AUDIENCE_OPTIONS = [
  { value: "ALL",    label: "All contacts",         desc: "Everyone with an email" },
  { value: "GREEN",  label: "Green — Leads",        desc: "Active leads not yet reserved" },
  { value: "AMBER",  label: "Amber — Reservations", desc: "Contacts with active reservations" },
  { value: "CLOSED", label: "Closed — Paying",      desc: "Contacts making payments" },
  { value: "PAST",   label: "Past — Completed",     desc: "Fully paid clients" },
]

type Attachment = {
  id:       string
  fileName: string
  fileUrl:  string
  mimeType: string
}

type Step = "compose" | "confirm" | "sending"

export function CampaignBuilder() {
  const [subject, setSubject]       = useState("")
  const [body, setBody]             = useState("")
  const [audience, setAudience]     = useState("ALL")
  const [count, setCount]           = useState<number | null>(null)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading]   = useState(false)
  const [step, setStep]             = useState<Step>("compose")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setCount(null)
    getAudienceCount(audience).then(setCount)
  }, [audience])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    let activeCampaignId = campaignId

    if (!activeCampaignId) {
      const fd = new FormData()
      fd.set("subject",  subject || "Draft")
      fd.set("body",     body || "<p></p>")
      fd.set("audience", audience)

      const result = await createCampaign(fd)
      if (result?.error || !result?.campaignId) {
        toast.error("Save the campaign first before adding attachments")
        return
      }
      activeCampaignId = result.campaignId
      setCampaignId(result.campaignId)
    }

    setUploading(true)
    for (const file of acceptedFiles) {
      const fd = new FormData()
      fd.append("file",       file)
      fd.append("campaignId", activeCampaignId)

      const res  = await fetch("/api/upload-attachment", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Attachment upload failed")
      } else {
        setAttachments((prev) => [...prev, data.attachment])
        toast.success(`${file.name} attached`)
      }
    }
    setUploading(false)
  }, [campaignId, subject, body, audience])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf":  [".pdf"],
      "image/jpeg":       [".jpg", ".jpeg"],
      "image/png":        [".png"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 25 * 1024 * 1024,
    disabled: uploading,
  })

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!subject.trim()) { toast.error("Subject is required"); return }
    if (!body || body === "<p></p>") { toast.error("Message body is required"); return }
    if (!count) { toast.error("No recipients in this audience segment"); return }

    if (!campaignId) {
      const fd = new FormData()
      fd.set("subject",  subject.trim())
      fd.set("body",     body)
      fd.set("audience", audience)

      const result = await createCampaign(fd)
      if (result?.error || !result?.campaignId) {
        toast.error(result?.error ?? "Failed to save campaign")
        return
      }
      setCampaignId(result.campaignId)
    }

    setStep("confirm")
  }

  function handleConfirm() {
    if (!campaignId) return
    setStep("sending")

    startTransition(async () => {
      const result = await sendCampaign(campaignId)

      if (result?.error) {
        toast.error(result.error)
        setStep("confirm")
      } else {
        toast.success(
          `Campaign sent to ${result.sent} recipient${result.sent !== 1 ? "s" : ""}` +
          (result.failed > 0 ? ` (${result.failed} failed)` : "")
        )
        setSubject("")
        setBody("")
        setAudience("ALL")
        setAttachments([])
        setCampaignId(null)
        setStep("compose")
      }
    })
  }

  if (step === "confirm" || step === "sending") {
    return (
      <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#30363d]">
          <h2 className="text-sm font-medium text-[#e6edf3]">Confirm send</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2.5 px-3 py-3 bg-[#4a30001a] border border-[#9e6a0333] rounded-lg">
            <AlertTriangle size={14} className="text-[#d29922] shrink-0 mt-0.5" />
            <p className="text-xs text-[#d29922] leading-relaxed">
              This will immediately send to{" "}
              <span className="font-semibold">{count} recipients</span>. This
              cannot be undone.
            </p>
          </div>

          <div className="space-y-2.5 px-1">
            <div className="flex gap-3 text-xs">
              <span className="text-[#7d8590] w-24 shrink-0">From</span>
              <span className="text-[#e6edf3]">{process.env.NEXT_PUBLIC_GMAIL_USER ?? "campaigns@lifestyleproperties.co.ke"}</span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-[#7d8590] w-24 shrink-0">Audience</span>
              <span className="text-[#e6edf3]">
                {AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label} —{" "}
                {count} recipient{count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-[#7d8590] w-24 shrink-0">Subject</span>
              <span className="text-[#e6edf3] font-medium">{subject}</span>
            </div>
            {attachments.length > 0 && (
              <div className="flex gap-3 text-xs">
                <span className="text-[#7d8590] w-24 shrink-0">Attachments</span>
                <span className="text-[#e6edf3]">
                  {attachments.map((a) => a.fileName).join(", ")}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {step === "confirm" ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setStep("compose")}
                  disabled={isPending}
                  className="text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
                >
                  Go back
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="gap-2 bg-[#238636] hover:bg-[#2ea043] text-white border-0"
                >
                  <Send size={13} />
                  {isPending ? "Sending…" : `Send to ${count} recipients`}
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#7d8590]">
                <Loader2 size={14} className="animate-spin" />
                Sending campaign…
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#30363d]">
        <h2 className="text-sm font-medium text-[#e6edf3]">New campaign</h2>
        <p className="text-xs text-[#7d8590] mt-0.5">
          Compose and send a targeted email campaign
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
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
                  className="text-[#e6edf3] focus:bg-[#21262d]"
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="ml-2 text-[#484f58] text-xs">{opt.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        {/* Rich text editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[#e6edf3] text-xs">
              Message <span className="text-[#f85149]">*</span>
            </Label>
            <span className="text-[10px] text-[#484f58]">
              Use {`{{name}}`} for first name personalisation
            </span>
          </div>
          <RichEditor
            content={body}
            onChange={setBody}
          />
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <Label className="text-[#e6edf3] text-xs">
            Attachments
            <span className="ml-1.5 text-[#484f58] font-normal">optional — max 25MB each</span>
          </Label>

          {attachments.length > 0 && (
            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-lg"
                >
                  <FileText size={13} className="text-[#7d8590] shrink-0" />
                  <span className="text-xs text-[#e6edf3] flex-1 truncate">
                    {att.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="text-[#484f58] hover:text-[#f85149] transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            {...getRootProps()}
            className={`flex items-center gap-2 px-3 py-2.5 border border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragActive
                ? "border-[#1f6feb] bg-[#1f6feb0d]"
                : "border-[#30363d] hover:border-[#484f58]"
            } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <Loader2 size={13} className="animate-spin text-[#7d8590]" />
            ) : (
              <Paperclip size={13} className="text-[#484f58]" />
            )}
            <span className="text-xs text-[#7d8590]">
              {uploading
                ? "Uploading…"
                : isDragActive
                ? "Drop files here"
                : "Drag files here or click to attach — PDF, images, Word"}
            </span>
          </div>
        </div>

        {/* Send button */}
        <div className="flex items-center justify-between pt-1 border-t border-[#21262d]">
          <p className="text-[11px] text-[#484f58]">
            Sends from Gmail via SMTP. You will see a preview before confirming.
          </p>
          <Button
            type="submit"
            disabled={!subject.trim() || !body || body === "<p></p>" || count === 0}
            className="gap-2"
          >
            <Send size={13} />
            Preview & send
          </Button>
        </div>
      </form>
    </div>
  )
}