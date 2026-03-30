import { FileText, Download, Clock } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

type Document = {
  id:         string
  type:       string
  fileName:   string
  fileUrl:    string
  uploadedAt: Date
}

type Props = {
  documents: Document[]
}

const DOC_LABELS: Record<string, string> = {
  NATIONAL_ID:           "National ID",
  KRA_PIN:               "KRA PIN",
  OFFER_LETTER_UNSIGNED: "Offer Letter (Unsigned)",
  OFFER_LETTER_SIGNED:   "Offer Letter (Signed)",
  BOOKING_RECEIPT:       "Booking Receipt",
}

export function DocumentGallery({ documents }: Props) {
  if (documents.length === 0) {
    return (
      <div className="py-6 text-center">
        <FileText size={20} className="mx-auto text-[#484f58] mb-2" />
        <p className="text-xs text-[#7d8590]">No documents uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#0d1117] border border-[#21262d] rounded-lg"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText size={14} className="text-[#7d8590] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#e6edf3] truncate">
                {DOC_LABELS[doc.type] ?? doc.type}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={10} className="text-[#484f58]" />
                <span className="text-[10px] text-[#484f58]">
                  {formatDateTime(doc.uploadedAt)}
                </span>
              </div>
            </div>
          </div>

          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#30363d] text-[11px] text-[#7d8590] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors"
          >
            <Download size={11} />
            Download
          </a>
        </div>
      ))}
    </div>
  )
}