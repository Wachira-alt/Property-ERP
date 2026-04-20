// @ts-nocheck
import { ClosingGate }      from "./ClosingGate"
import { FinalizeSaleBtn }  from "./FinalizeSaleBtn"
import { ExtendReservationBtn } from "./ExtendReservationBtn"
import { DocumentGallery }  from "./DocumentGallery"
import { canPerform }       from "@/lib/permissions"
import { formatCurrency, formatDate, getDaysRemaining } from "@/lib/utils"
import {
  Lock,
  Clock,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
} from "lucide-react"

type Document = {
  id:         string
  type:       string
  fileName:   string
  fileUrl:    string
  uploadedAt: Date
}

type LedgerEntry = {
  id:     string
  amount: number | { toNumber: () => number }
  status: string
}

type Opportunity = {
  id:            string
  agreedPrice:   number | null | { toNumber: () => number }
  paymentMethod: string | null
  unitId:        string | null
  closedAt:      Date | null
  unit: {
    id:            string
    name:          string
    reservedUntil: Date | null
    unitType:      { name: string }
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

type Session = {
  id:    string
  role:  string
  name:  string
  email: string
}

type Props = {
  contact:     Contact
  opportunity: Opportunity
  session:     Session
}

const REQUIRED_DOC_TYPES = [
  "NATIONAL_ID",
  "KRA_PIN",
  "OFFER_LETTER_SIGNED",
  "BOOKING_RECEIPT",
]

export function BlueStage({ contact, opportunity, session }: Props) {
  const agreedPriceNum = opportunity.agreedPrice
    ? typeof opportunity.agreedPrice === "object"
      ? opportunity.agreedPrice.toNumber()
      : Number(opportunity.agreedPrice)
    : null

  const docTypes   = opportunity.documents.map((d) => d.type)
  const allDocsOk  = REQUIRED_DOC_TYPES.every((t) => docTypes.includes(t))

  const ledgerTotal = opportunity.ledgerEntries.reduce(
    (sum, e) => sum + (typeof e.amount === "object" ? e.amount.toNumber() : Number(e.amount)),
    0
  )
  const ledgerOk = agreedPriceNum ? ledgerTotal >= agreedPriceNum : false

  const gatePass = allDocsOk && ledgerOk

  const daysRemaining = getDaysRemaining(opportunity.unit?.reservedUntil ?? null)
  const isExpired     = daysRemaining !== null && daysRemaining <= 0

  const canFinalize = canPerform(session.role as any, "MOVE_TO_CLOSED")
  const canExtend   = canPerform(session.role as any, "EXTEND_RESERVATION")

  return (
    <div className="space-y-5">
      {/* Reservation timer + GM extension */}
      {opportunity.unit?.reservedUntil && (
        <div
          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-xs ${
            isExpired
              ? "bg-[#3d1f1f1a] border-[#da363333] text-[#f85149]"
              : daysRemaining && daysRemaining <= 2
              ? "bg-[#4a30001a] border-[#9e6a0333] text-[#d29922]"
              : "bg-[#1a4f2a1a] border-[#2ea04333] text-[#3fb950]"
          }`}
        >
          <div className="flex items-center gap-2">
            {isExpired ? (
              <AlertTriangle size={13} className="shrink-0" />
            ) : (
              <Clock size={13} className="shrink-0" />
            )}
            <span className="font-medium">
              {isExpired
                ? "Reservation expired"
                : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining · Expires ${formatDate(opportunity.unit.reservedUntil)}`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 opacity-60">
              <Lock size={11} />
              <span>{opportunity.unit.name}</span>
            </div>
            {canExtend && opportunity.unit && (
              <ExtendReservationBtn
                unitId={opportunity.unit.id}
                unitName={opportunity.unit.name}
                currentExpiry={opportunity.unit.reservedUntil}
              />
            )}
          </div>
        </div>
      )}

      {/* Deal summary */}
      {agreedPriceNum && (
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7d8590]">
              Ledger:{" "}
              <span className={`font-medium ${ledgerOk ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                {formatCurrency(ledgerTotal)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Closing gate */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#7d8590] uppercase tracking-wider">
          Closing gate
        </p>
        <ClosingGate documents={opportunity.documents} />
      </div>

      {/* Ledger check */}
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${
          ledgerOk
            ? "bg-[#1a4f2a1a] border-[#2ea04333] text-[#3fb950]"
            : "bg-[#3d1f1f1a] border-[#da363333] text-[#f85149]"
        }`}
      >
        <CheckCircle2 size={13} className="shrink-0" />
        <span>
          {ledgerOk
            ? `Payment schedule valid — ${formatCurrency(ledgerTotal)} scheduled`
            : `Ledger total (${formatCurrency(ledgerTotal)}) is less than agreed price (${formatCurrency(agreedPriceNum ?? 0)})`}
        </span>
      </div>

      {/* Finalize button — only when gate passes and user has permission */}
      {canFinalize && (
        <div className="border-t border-[#21262d] pt-4">
          {gatePass ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#e6edf3]">
                  Ready to finalize
                </p>
                <p className="text-[11px] text-[#7d8590] mt-0.5">
                  All checks passed. This action is permanent and cannot be undone.
                </p>
              </div>
              <FinalizeSaleBtn
                contactId={contact.id}
                contactName={`${contact.firstName} ${contact.lastName}`}
                unitName={opportunity.unit?.name ?? "—"}
                agreedPrice={formatCurrency(agreedPriceNum ?? 0)}
              />
            </div>
          ) : (
            <div className="px-3 py-2.5 border border-dashed border-[#30363d] rounded-lg">
              <p className="text-xs text-[#484f58]">
                Complete all closing gate requirements above to enable finalization.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}