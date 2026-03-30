"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KYCUploader }          from "./KYCUploader"
import { ManualLedgerBuilder }  from "./ManualLedgerBuilder"
import { DocumentGallery }      from "./DocumentGallery"
import { moveToReservation }    from "@/actions/pipeline"
import { formatCurrency, formatDate, getDaysRemaining } from "@/lib/utils"
import {
  Lock,
  Clock,
  AlertTriangle,
  FileDown,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Document = {
  id:         string
  type:       string
  fileName:   string
  fileUrl:    string
  uploadedAt: Date
}

type LedgerEntry = {
  id:          string
  description: string
  amount:      number | { toNumber: () => number }
  dueDate:     Date
  status:      string
}

type Opportunity = {
  id:            string
  agreedPrice:   number | null | { toNumber: () => number }
  paymentMethod: string | null
  unitId:        string | null
  unit:          {
    id:           string
    name:         string
    reservedUntil: Date | null
    unitType:     { name: string }
  } | null
  ledgerEntries: LedgerEntry[]
  documents:     Document[]
}

type Contact = {
  id:        string
  firstName: string
  lastName:  string
  phone:     string
  email:     string | null
}

type Props = {
  contact:     Contact
  opportunity: Opportunity
  session:     { id: string; role: string; name: string; email: string }
}

type Section = "kyc" | "ledger" | "documents" | "offer"

export function AmberStage({ contact, opportunity, session }: Props) {
  const [isPending, startTransition] = useTransition()
  const [openSection, setOpenSection] = useState<Section>("kyc")

  const [showReservationForm, setShowReservationForm] = useState(
    !opportunity.agreedPrice
  )
  const [agreedPrice, setAgreedPrice]     = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  const daysRemaining = getDaysRemaining(opportunity.unit?.reservedUntil ?? null)
  const isExpired     = daysRemaining !== null && daysRemaining <= 0

  const agreedPriceNum = opportunity.agreedPrice
    ? typeof opportunity.agreedPrice === "object"
      ? opportunity.agreedPrice.toNumber()
      : Number(opportunity.agreedPrice)
    : null

  // KYC document presence checks
  const hasNationalId = opportunity.documents.some((d) => d.type === "NATIONAL_ID")
  const hasKraPin     = opportunity.documents.some((d) => d.type === "KRA_PIN")

  const nationalIdDoc = opportunity.documents.find((d) => d.type === "NATIONAL_ID")
  const kraPinDoc     = opportunity.documents.find((d) => d.type === "KRA_PIN")

  function handleMoveToReservation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!agreedPrice || !paymentMethod) {
      toast.error("Please fill in all required fields")
      return
    }

    const fd = new FormData()
    fd.set("contactId",     contact.id)
    fd.set("agreedPrice",   agreedPrice)
    fd.set("paymentMethod", paymentMethod)

    startTransition(async () => {
      const result = await moveToReservation(fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Reservation created — unit locked for 7 days")
        setShowReservationForm(false)
      }
    })
  }

  function toggleSection(s: Section) {
    setOpenSection((prev) => (prev === s ? "kyc" : s))
  }

  return (
    <div className="space-y-5">
      {/* Reservation timer */}
      {opportunity.unit?.reservedUntil && (
        <div
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${
            isExpired
              ? "bg-[#3d1f1f1a] border-[#da363333] text-[#f85149]"
              : daysRemaining && daysRemaining <= 2
              ? "bg-[#4a30001a] border-[#9e6a0333] text-[#d29922]"
              : "bg-[#1a4f2a1a] border-[#2ea04333] text-[#3fb950]"
          }`}
        >
          {isExpired ? (
            <AlertTriangle size={13} className="shrink-0" />
          ) : (
            <Clock size={13} className="shrink-0" />
          )}
          <div>
            {isExpired ? (
              <p className="font-medium">Reservation expired</p>
            ) : (
              <p className="font-medium">
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                <span className="ml-1.5 font-normal opacity-80">
                  · Expires {formatDate(opportunity.unit.reservedUntil)}
                </span>
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1 opacity-60">
            <Lock size={11} />
            <span>{opportunity.unit.name}</span>
          </div>
        </div>
      )}

      {/* Agreed price & payment — shows form if not yet set */}
      {agreedPriceNum ? (
        <div className="flex flex-wrap gap-4 px-3 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg">
          <div className="flex items-center gap-2">
            <CreditCard size={13} className="text-[#484f58]" />
            <span className="text-xs text-[#7d8590]">
              Agreed price:{" "}
              <span className="text-[#e6edf3] font-semibold">
                {formatCurrency(agreedPriceNum)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7d8590]">
              Method:{" "}
              <span className="text-[#e6edf3] font-medium capitalize">
                {opportunity.paymentMethod?.toLowerCase()}
              </span>
            </span>
          </div>
        </div>
      ) : null}

      {/* Accordion sections — only available after price is set */}
      {agreedPriceNum && (
        <div className="space-y-2">
          {/* KYC Documents */}
          <AccordionSection
            id="kyc"
            open={openSection === "kyc"}
            onToggle={() => toggleSection("kyc")}
            title="KYC Documents"
            complete={hasNationalId && hasKraPin}
            badge={`${[hasNationalId, hasKraPin].filter(Boolean).length}/2`}
          >
            <div className="space-y-4">
              <KYCUploader
                opportunityId={opportunity.id}
                type="NATIONAL_ID"
                label="National ID"
                description="Front and back scan or clear photo"
                uploaded={hasNationalId}
                fileUrl={nationalIdDoc?.fileUrl}
                fileName={nationalIdDoc?.fileName}
              />
              <KYCUploader
                opportunityId={opportunity.id}
                type="KRA_PIN"
                label="KRA PIN Certificate"
                description="KRA PIN certificate PDF or photo"
                uploaded={hasKraPin}
                fileUrl={kraPinDoc?.fileUrl}
                fileName={kraPinDoc?.fileName}
              />
            </div>
          </AccordionSection>

          {/* Payment schedule */}
          <AccordionSection
            id="ledger"
            open={openSection === "ledger"}
            onToggle={() => toggleSection("ledger")}
            title="Payment Schedule"
            complete={
              opportunity.ledgerEntries.length > 0 &&
              opportunity.ledgerEntries.reduce(
                (s, e) => s + (typeof e.amount === "object" ? e.amount.toNumber() : Number(e.amount)), 0
              ) >= agreedPriceNum
            }
            badge={`${opportunity.ledgerEntries.length} entries`}
          >
            <ManualLedgerBuilder
              opportunityId={opportunity.id}
              contactId={contact.id}
              agreedPrice={agreedPriceNum}
              entries={opportunity.ledgerEntries}
            />
          </AccordionSection>

          {/* Offer Letter */}
          <AccordionSection
            id="offer"
            open={openSection === "offer"}
            onToggle={() => toggleSection("offer")}
            title="Offer Letter"
            complete={opportunity.documents.some(
              (d) => d.type === "OFFER_LETTER_UNSIGNED" || d.type === "OFFER_LETTER_SIGNED"
            )}
            badge="PDF"
          >
            <div className="space-y-3">
              <p className="text-xs text-[#7d8590]">
                Generate the Letter of Offer for the client to sign. Once signed,
                upload the signed copy to proceed to closing.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/documents/offer-letter?contactId=${contact.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#30363d] rounded-md text-[#e6edf3] hover:border-[#484f58] hover:bg-[#21262d] transition-colors"
                >
                  <FileDown size={13} />
                  Download Offer Letter
                </a>
              </div>

              {/* Upload signed copy */}
              <div className="pt-2 border-t border-[#21262d]">
                <p className="text-xs font-medium text-[#e6edf3] mb-3">
                  Upload signed copy
                </p>
                <KYCUploader
                  opportunityId={opportunity.id}
                  type="OFFER_LETTER_SIGNED"
                  label="Signed Offer Letter"
                  description="Upload the signed PDF from the client"
                  uploaded={opportunity.documents.some(
                    (d) => d.type === "OFFER_LETTER_SIGNED"
                  )}
                  fileUrl={opportunity.documents.find(
                    (d) => d.type === "OFFER_LETTER_SIGNED"
                  )?.fileUrl}
                  fileName={opportunity.documents.find(
                    (d) => d.type === "OFFER_LETTER_SIGNED"
                  )?.fileName}
                />
              </div>
            </div>
          </AccordionSection>

          {/* All documents */}
          <AccordionSection
            id="documents"
            open={openSection === "documents"}
            onToggle={() => toggleSection("documents")}
            title="All Documents"
            complete={false}
            badge={`${opportunity.documents.length}`}
          >
            <DocumentGallery documents={opportunity.documents} />
          </AccordionSection>
        </div>
      )}
    </div>
  )
}

// ─── Accordion helper ─────────────────────────────────────────────────────────

function AccordionSection({
  id,
  open,
  onToggle,
  title,
  complete,
  badge,
  children,
}: {
  id:       Section
  open:     boolean
  onToggle: () => void
  title:    string
  complete: boolean
  badge:    string
  children: React.ReactNode
}) {
  return (
    <div className="border border-[#30363d] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#161b22] hover:bg-[#21262d] transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              complete ? "bg-[#3fb950]" : "bg-[#484f58]"
            }`}
          />
          <span className="text-xs font-medium text-[#e6edf3]">{title}</span>
          <span className="text-[10px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded">
            {badge}
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-[#484f58]" />
        ) : (
          <ChevronDown size={14} className="text-[#484f58]" />
        )}
      </button>

      {open && <div className="px-4 py-4 bg-[#0d1117]">{children}</div>}
    </div>
  )
}