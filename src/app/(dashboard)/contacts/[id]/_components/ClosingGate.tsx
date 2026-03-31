import { CheckCircle2, Circle, Download } from "lucide-react"

type Document = {
  id:       string
  type:     string
  fileName: string
  fileUrl:  string
}

type Props = {
  documents: Document[]
}

const REQUIRED_DOCS = [
  {
    type:        "NATIONAL_ID",
    label:       "National ID",
    description: "Client identity document",
  },
  {
    type:        "KRA_PIN",
    label:       "KRA PIN Certificate",
    description: "Kenya Revenue Authority PIN",
  },
  {
    type:        "OFFER_LETTER_SIGNED",
    label:       "Signed Offer Letter",
    description: "Letter of offer signed by client",
  },
  {
    type:        "BOOKING_RECEIPT",
    label:       "Booking Receipt",
    description: "Signed booking confirmation receipt",
  },
] as const

export function ClosingGate({ documents }: Props) {
  const docMap = new Map(documents.map((d) => [d.type, d]))

  const checks = REQUIRED_DOCS.map((req) => ({
    ...req,
    present: docMap.has(req.type),
    doc:     docMap.get(req.type),
  }))

  const allPresent = checks.every((c) => c.present)
  const passCount  = checks.filter((c) => c.present).length

  return (
    <div className="space-y-3">
      {/* Gate status banner */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs ${
          allPresent
            ? "bg-[#1a4f2a1a] border-[#2ea04333] text-[#3fb950]"
            : "bg-[#4a30001a] border-[#9e6a0333] text-[#d29922]"
        }`}
      >
        <span className="font-medium">
          {allPresent
            ? "All documents verified — ready to finalize"
            : `${passCount} of 4 documents present`}
        </span>
        <span className="opacity-70">
          {passCount}/4
        </span>
      </div>

      {/* Document checklist */}
      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.type}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border ${
              check.present
                ? "bg-[#161b22] border-[#21262d]"
                : "bg-[#0d1117] border-[#30363d] border-dashed"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {check.present ? (
                <CheckCircle2 size={14} className="text-[#3fb950] shrink-0" />
              ) : (
                <Circle size={14} className="text-[#484f58] shrink-0" />
              )}
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${
                  check.present ? "text-[#e6edf3]" : "text-[#484f58]"
                }`}>
                  {check.label}
                </p>
                <p className="text-[10px] text-[#484f58] mt-0.5">
                  {check.present
                    ? check.doc?.fileName
                    : check.description}
                </p>
              </div>
            </div>

            {check.present && check.doc && (
              <a
                href={check.doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded border border-[#30363d] text-[10px] text-[#7d8590] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors"
              >
                <Download size={10} />
                View
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}