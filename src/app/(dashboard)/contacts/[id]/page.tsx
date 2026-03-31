import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getContactById } from "@/actions/contacts"
import { getAvailableUnitsByProject } from "@/actions/inventory"
import { PipelineStages } from "./_components/PipelineStages"
import { GreenStage }     from "./_components/GreenStage"
import { AmberStage }     from "./_components/AmberStage"
import { BlueStage }      from "./_components/BlueStage"
import { AddNoteForm }    from "./_components/AddNoteForm"
import { MoveToAmberBtn } from "./_components/MoveToAmberBtn"
import { formatDate }     from "@/lib/utils"
import { canPerform }     from "@/lib/permissions"
import {
  Phone,
  Mail,
  User,
  Building2,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { FinalizeSaleBtn } from "./_components/FinalizeSaleBtn"
import { formatCurrency }  from "@/lib/utils"

type Props = {
  params: Promise<{ id: string }>
}

const STAGE_DOT: Record<string, string> = {
  GREEN:     "bg-[#3fb950]",
  AMBER:     "bg-[#d29922]",
  CLOSED:    "bg-[#58a6ff]",
  PAST:      "bg-[#a371f7]",
  EXPIRED:   "bg-[#484f58]",
  CANCELLED: "bg-[#f85149]",
}

const STAGE_LABEL: Record<string, string> = {
  GREEN:     "Green Stage — Lead",
  AMBER:     "Amber Stage — Reservation",
  CLOSED:    "Blue Stage — Closed",
  PAST:      "Past — Fully Paid",
  EXPIRED:   "Expired",
  CANCELLED: "Cancelled",
}

export default async function ContactDetailPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { id }  = await params
  const contact = await getContactById(id)

  if (!contact) notFound()

  const opp          = contact.opportunity
  const currentStage = opp?.stage ?? "GREEN"

  const availableUnits = opp
    ? await getAvailableUnitsByProject(contact.projectId)
    : []

  const hasNationalId = opp?.documents.some((d) => d.type === "NATIONAL_ID") ?? false
  const hasKraPin     = opp?.documents.some((d) => d.type === "KRA_PIN")     ?? false

  const canMoveToAmber =
    currentStage === "GREEN" &&
    !!opp?.unitId &&
    hasNationalId &&
    hasKraPin &&
    canPerform(session.role, "MOVE_TO_AMBER")
  const canShowFinalizeBtn =
  currentStage === "AMBER" &&
  canPerform(session.role, "MOVE_TO_CLOSED")

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back link */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-xs text-[#7d8590] hover:text-[#e6edf3] transition-colors"
      >
        <ArrowLeft size={13} />
        Back to contacts
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1f6feb] flex items-center justify-center shrink-0 text-sm font-bold text-white">
            {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#e6edf3]">
              {contact.firstName} {contact.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-[#7d8590]">
                <Phone size={11} />
                {contact.phone}
              </span>
              {contact.email && (
                <span className="flex items-center gap-1 text-xs text-[#7d8590]">
                  <Mail size={11} />
                  {contact.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <PipelineStages currentStage={currentStage as any} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-lg">
        <div className="flex items-center gap-2">
          <Building2 size={13} className="text-[#484f58]" />
          <span className="text-xs text-[#7d8590]">
            Project:{" "}
            <span className="text-[#e6edf3] font-medium">
              {contact.project.name}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <User size={13} className="text-[#484f58]" />
          <span className="text-xs text-[#7d8590]">
            Agent:{" "}
            <span className="text-[#e6edf3] font-medium">
              {contact.agent.name}
            </span>
          </span>
        </div>
        {opp?.unit && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7d8590]">
              Unit:{" "}
              <span className="text-[#e6edf3] font-medium">
                {opp.unit.name}
              </span>
            </span>
          </div>
        )}
        <div className="ml-auto">
          <span className="text-[11px] text-[#484f58]">
            Added {formatDate(contact.createdAt)}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pipeline stage panel — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
            {/* Stage card header */}
            <div className="px-5 py-3.5 border-b border-[#30363d] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    STAGE_DOT[currentStage] ?? "bg-[#484f58]"
                  }`}
                />
                <h2 className="text-sm font-medium text-[#e6edf3]">
                  {STAGE_LABEL[currentStage] ?? currentStage}
                </h2>
              </div>

              {canMoveToAmber && (
                <MoveToAmberBtn contactId={contact.id} />
              )}
              {canShowFinalizeBtn && opp && (
  <FinalizeSaleBtn
    contactId={contact.id}
    contactName={`${contact.firstName} ${contact.lastName}`}
    unitName={opp.unit?.name ?? "—"}
    agreedPrice={
      opp.agreedPrice
        ? formatCurrency(
            typeof opp.agreedPrice === "object"
              ? (opp.agreedPrice as any).toNumber()
              : Number(opp.agreedPrice)
          )
        : "—"
    }
  />
)}
              
            </div>

            {/* Stage content */}
            <div className="p-5">
              {currentStage === "GREEN" && (
                <GreenStage
                  contactId={contact.id}
                  opportunityId={opp?.id ?? null}
                  assignedUnitId={opp?.unitId ?? null}
                  assignedUnit={opp?.unit ?? null}
                  availableUnits={availableUnits}
                  documents={opp?.documents ?? []}
                />
              )}

              {currentStage === "AMBER" && opp && (
                <AmberStage
                  contact={contact}
                  opportunity={{
                    ...opp,
                    agreedPrice:   opp.agreedPrice   ?? null,
                    paymentMethod: opp.paymentMethod ?? null,
                    unitId:        opp.unitId        ?? null,
                  }}
                  session={session}
                />
              )}

              {currentStage === "CLOSED" && opp && (
                <BlueStage
                  contact={contact}
                  opportunity={opp}
                  session={session}
                />
              )}

              {currentStage === "PAST" && (
                <div className="py-6 text-center space-y-1">
                  <p className="text-sm font-medium text-[#a371f7]">
                    Fully paid
                  </p>
                  <p className="text-xs text-[#7d8590]">
                    All payments have been received. This client is available
                    for future marketing campaigns.
                  </p>
                </div>
              )}

              {currentStage === "EXPIRED" && (
                <div className="py-6 text-center space-y-1">
                  <p className="text-sm font-medium text-[#7d8590]">
                    Reservation expired
                  </p>
                  <p className="text-xs text-[#484f58]">
                    The 7-day reservation window elapsed. The unit has been
                    released back to available inventory.
                  </p>
                </div>
              )}

              {currentStage === "CANCELLED" && (
                <div className="py-6 text-center space-y-1">
                  <p className="text-sm font-medium text-[#f85149]">
                    Cancelled
                  </p>
                  <p className="text-xs text-[#484f58]">
                    This opportunity was cancelled.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes panel — 1/3 width */}
        <div className="lg:col-span-1">
          <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#30363d]">
              <h2 className="text-sm font-medium text-[#e6edf3]">Activity</h2>
            </div>
            <div className="p-4">
              <AddNoteForm
                contactId={contact.id}
                notes={contact.notes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}