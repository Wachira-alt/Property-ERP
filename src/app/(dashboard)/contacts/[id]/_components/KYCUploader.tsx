// @ts-nocheck
"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Upload, FileCheck, Loader2 } from "lucide-react"
import { saveDocumentRecord } from "@/actions/documents"

type DocumentType =
  | "NATIONAL_ID"
  | "KRA_PIN"
  | "OFFER_LETTER_SIGNED"
  | "BOOKING_RECEIPT"

type Props = {
  opportunityId: string
  type:          DocumentType
  label:         string
  description:   string
  uploaded?:     boolean
  fileUrl?:      string
  fileName?:     string
}

export function KYCUploader({
  opportunityId,
  type,
  label,
  description,
  uploaded,
  fileUrl,
  fileName,
}: Props) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setIsUploading(true)

      try {
        const fd = new FormData()
        fd.append("file",    file)
        fd.append("docType", type)

        const res = await fetch("/api/upload", {
          method: "POST",
          body:   fd,
        })

        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error ?? "Upload failed")
          return
        }

        const result = await saveDocumentRecord({
          opportunityId,
          type,
          fileName: data.fileName,
          fileUrl:  data.viewUrl,
          fileKey:  data.fileId,
        })

        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success(`${label} uploaded successfully`)
        }
      } catch {
        toast.error("Upload failed. Please try again.")
      } finally {
        setIsUploading(false)
      }
    },
    [opportunityId, type, label]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg":      [".jpg", ".jpeg"],
      "image/png":       [".png"],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#e6edf3]">{label}</p>
          <p className="text-[11px] text-[#7d8590]">{description}</p>
        </div>
        {uploaded && (
          <span className="flex items-center gap-1 text-[11px] text-[#3fb950]">
            <FileCheck size={12} />
            Uploaded
          </span>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`relative border border-dashed rounded-lg px-4 py-4 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-[#1f6feb] bg-[#1f6feb0d]"
            : uploaded
            ? "border-[#2ea04333] bg-[#1a4f2a0d] hover:border-[#2ea043]"
            : "border-[#30363d] hover:border-[#484f58] bg-[#0d1117]"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex items-center justify-center gap-2 text-[#7d8590]">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Uploading to Drive…</span>
          </div>
        ) : uploaded && fileName ? (
          <div className="space-y-1">
            <p className="text-xs text-[#3fb950] font-medium truncate">{fileName}</p>
            <p className="text-[11px] text-[#7d8590]">Drop a new file to replace</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Upload size={16} className="mx-auto text-[#484f58]" />
            <p className="text-xs text-[#7d8590]">
              {isDragActive ? "Drop file here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-[10px] text-[#484f58]">PDF, JPG, PNG — max 8MB</p>
          </div>
        )}
      </div>

      {uploaded && fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-[#58a6ff] hover:underline"
        >
          View on Google Drive →
        </a>
      )}
    </div>
  )
}