// @ts-nocheck
"use client"

import { useRef, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { addNote } from "@/actions/contacts"
import { formatDateTime } from "@/lib/utils"
import { MessageSquare } from "lucide-react"

type Note = {
  id:        string
  content:   string
  createdAt: Date
  author:    { id: string; name: string }
}

type Props = {
  contactId: string
  notes:     Note[]
}

export function AddNoteForm({ contactId, notes }: Props) {
  const formRef              = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("contactId", contactId)

    startTransition(async () => {
      const result = await addNote(fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        formRef.current?.reset()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
        <textarea
          name="content"
          required
          rows={3}
          placeholder="Add a note, call summary, or follow-up reminder…"
          className="w-full px-3 py-2.5 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#1f6feb] resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving..." : "Add note"}
          </Button>
        </div>
      </form>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="py-6 text-center">
          <MessageSquare size={20} className="mx-auto text-[#484f58] mb-2" />
          <p className="text-xs text-[#7d8590]">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border border-[#21262d] rounded-lg px-4 py-3 bg-[#161b22]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#1f6feb] flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-white">
                      {note.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#e6edf3]">
                    {note.author.name}
                  </span>
                </div>
                <span className="text-[10px] text-[#484f58]">
                  {formatDateTime(note.createdAt)}
                </span>
              </div>
              <p className="text-sm text-[#7d8590] leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}