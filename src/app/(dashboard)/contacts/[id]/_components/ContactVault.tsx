// @ts-nocheck
"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, FileText, Download, Trash2, Loader2 } from "lucide-react"
import { uploadContactDocument, deleteContactDocument } from "@/actions/documents"
import { formatDateTime } from "@/lib/utils"

type Doc = {
  id:           string
  fileName:     string
  fileUrl:      string
  mimeType:     string
  uploaderName: string
  createdAt:    Date
}

type Props = {
  contactId: string
  documents: Doc[]
  canDelete: boolean
}

export function ContactVault({ contactId, documents, canDelete }: Props) {
  const fileInputRef              = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file",    file)
      fd.append("docType", "vault_document")

      const res  = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Upload failed")
        return
      }

      const result = await uploadContactDocument({
        contactId,
        fileName: file.name,
        fileUrl:  data.viewUrl,
        fileKey:  data.fileId,
        mimeType: file.type,
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Document uploaded")
      }
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDelete(documentId: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return

    setDeletingId(documentId)
    const result = await deleteContactDocument(documentId, contactId)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Document deleted")
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-2 px-3 py-3 border border-dashed border-[#30363d] rounded-lg cursor-pointer hover:border-[#484f58] hover:bg-[#21262d] transition-colors"
      >
        {uploading ? (
          <>
            <Loader2 size={14} className="text-[#7d8590] animate-spin" />
            <span className="text-xs text-[#7d8590]">Uploading…</span>
          </>
        ) : (
          <>
            <Upload size={14} className="text-[#484f58]" />
            <span className="text-xs text-[#7d8590]">
              Click to upload a document
            </span>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Documents list */}
      {documents.length === 0 ? (
        <div className="py-4 text-center">
          <FileText size={16} className="mx-auto text-[#484f58] mb-1.5" />
          <p className="text-xs text-[#484f58]">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#0d1117] border border-[#21262d] rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={13} className="text-[#484f58] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[#e6edf3] truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-[10px] text-[#484f58]">
                    {doc.uploaderName} · {formatDateTime(doc.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded text-[#484f58] hover:text-[#58a6ff] hover:bg-[#21262d] transition-colors"
                >
                  <Download size={12} />
                </a>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded text-[#484f58] hover:text-[#f85149] hover:bg-[#3d1f1f] transition-colors disabled:opacity-50"
                  >
                    {deletingId === doc.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}