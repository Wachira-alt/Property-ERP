import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getContactById } from "@/actions/contacts"
import { getAvailableUnitsByProject } from "@/actions/inventory"
import { PipelineStages } from "./_components/PipelineStages"
import { GreenStage } from "./_components/GreenStage"
import { AmberStage } from "./_components/AmberStage"
import { BlueStage } from "./_components/BlueStage"
import { AddNoteForm } from "./_components/AddNoteForm"
import { formatDate } from "@/lib/utils"
import { Phone, Mail, User, Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { id }  = await params
  const contact = await getContactById(id)

  if (!contact) notFound()

  const opp           = contact.opportunity
  const currentStage  = opp?.stage ?? "GREEN"
  const availableUnits = opp
    ? await getAvailableUnitsByProject(contact.projectId)
    : []

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
        <div className="ml-auto">
          <span className="text-[11px] text-[#484f58]">
            Added {formatDate(contact.createdAt)}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pipeline stage panel — 2/3 width */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stage card */}
          <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#30363d] flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStage === "GREEN"
                    ? "bg-[#3fb950]"
                    : currentStage === "AMBER"
                    ? "bg-[#d29922]"
                    : currentStage === "CLOSED"
                    ? "bg-[#58a6ff]"
                    : "bg-[#484f58]"
                }`}
              />
              <h2 className="text-sm font-medium text-[#e6edf3]">
                {currentStage === "GREEN"
                  ? "Green Stage — Lead"
                  : currentStage === "AMBER"
                  ? "Amber Stage — Reservation"
                  : currentStage === "CLOSED"
                  ? "Blue Stage — Closed"
                  : currentStage === "EXPIRED"
                  ? "Expired"
                  : "Cancelled"}
              </h2>
            </div>

            <div className="p-5">
              {currentStage === "GREEN" && (
                <GreenStage
                  contactId={contact.id}
                  assignedUnitId={opp?.unitId ?? null}
                  assignedUnit={opp?.unit ?? null}
                  availableUnits={availableUnits}
                />
              )}
              {currentStage === "AMBER" && (
                <AmberStage
                  contact={contact}
                  opportunity={opp!}
                  session={session}
                />
              )}
              {currentStage === "CLOSED" && (
                <BlueStage
                  contact={contact}
                  opportunity={opp!}
                  session={session}
                />
              )}
              {(currentStage === "EXPIRED" || currentStage === "CANCELLED") && (
                <p className="text-sm text-[#7d8590]">
                  This opportunity has been {currentStage.toLowerCase()}.
                </p>
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