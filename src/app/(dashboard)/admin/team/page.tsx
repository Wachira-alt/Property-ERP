// @ts-nocheck
import { redirect }      from "next/navigation"
import { getSession }    from "@/lib/auth"
import { canPerform }    from "@/lib/permissions"
import { getTeamMembers, deactivateUser, resetPassword } from "@/actions/team"
import { AddUserModal }  from "@/components/modals/AddUserModal"
import { TeamRowActions } from "./_components/TeamRowActions"
import { formatDate }    from "@/lib/utils"
import { Users, Shield } from "lucide-react"

const ROLE_STYLES: Record<string, string> = {
  ADMIN:           "bg-[#3d1f1f] text-[#f85149] border-[#da3633]",
  GENERAL_MANAGER: "bg-[#0d2a4a] text-[#58a6ff] border-[#1f6feb]",
  SALES:           "bg-[#1a4f2a] text-[#3fb950] border-[#2ea043]",
  ACCOUNTANT:      "bg-[#4a3000] text-[#d29922] border-[#9e6a03]",
  HR:              "bg-[#2d1f5e] text-[#a371f7] border-[#6e40c9]",
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN:           "Admin",
  GENERAL_MANAGER: "General Manager",
  SALES:           "Sales",
  ACCOUNTANT:      "Accountant",
  HR:              "HR",
}

export default async function TeamPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!canPerform(session.role, "MANAGE_TEAM")) redirect("/contacts")

  const members = await getTeamMembers()

  const active   = members.filter((m) => m.isActive)
  const inactive = members.filter((m) => !m.isActive)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Team</h1>
          <p className="text-sm text-[#7d8590] mt-0.5">
            {active.length} active member{active.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AddUserModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = members.filter(
            (m) => m.role === role && m.isActive
          ).length
          return (
            <div
              key={role}
              className="border border-[#30363d] rounded-lg bg-[#161b22] px-3 py-2.5"
            >
              <p className="text-[10px] text-[#7d8590]">{label}</p>
              <p className="text-lg font-semibold text-[#e6edf3] mt-0.5">
                {count}
              </p>
            </div>
          )
        })}
      </div>

      {/* Active members */}
      <div className="border border-[#30363d] rounded-lg overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_160px_100px_100px_80px] gap-4 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
          <span className="text-xs font-medium text-[#7d8590]">Member</span>
          <span className="text-xs font-medium text-[#7d8590]">Role</span>
          <span className="text-xs font-medium text-[#7d8590]">Contacts</span>
          <span className="text-xs font-medium text-[#7d8590]">Joined</span>
          <span className="text-xs font-medium text-[#7d8590]">Actions</span>
        </div>

        <div className="divide-y divide-[#21262d]">
          {active.map((member) => (
            <div
              key={member.id}
              className="flex flex-col sm:grid sm:grid-cols-[1fr_160px_100px_100px_80px] gap-2 sm:gap-4 px-4 py-3.5 bg-[#0d1117] hover:bg-[#161b22] transition-colors"
            >
              {/* Name + email */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1f6feb] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#e6edf3] truncate">
                      {member.name}
                      {member.id === session.id && (
                        <span className="ml-2 text-[10px] text-[#484f58]">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#7d8590] truncate">
                      {member.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role badge */}
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border ${
                    ROLE_STYLES[member.role] ?? ""
                  }`}
                >
                  {member.role === "ADMIN" && (
                    <Shield size={9} />
                  )}
                  {ROLE_LABELS[member.role]}
                </span>
              </div>

              {/* Contact count */}
              <div className="flex items-center">
                <span className="text-xs text-[#7d8590]">
                  {member._count.assignedContacts} contact
                  {member._count.assignedContacts !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Joined date */}
              <div className="flex items-center">
                <span className="text-xs text-[#7d8590]">
                  {formatDate(member.createdAt)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center">
                <TeamRowActions
                  member={member}
                  currentUserId={session.id}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inactive members */}
      {inactive.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#484f58] uppercase tracking-wider">
            Deactivated ({inactive.length})
          </p>
          <div className="border border-[#30363d] rounded-lg overflow-hidden opacity-60">
            <div className="divide-y divide-[#21262d]">
              {inactive.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 px-4 py-3 bg-[#0d1117]"
                >
                  <div className="w-6 h-6 rounded-full bg-[#21262d] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#484f58]">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#484f58] truncate line-through">
                      {member.name}
                    </p>
                    <p className="text-xs text-[#484f58] truncate">{member.email}</p>
                  </div>
                  <span className="text-[10px] text-[#484f58]">
                    {ROLE_LABELS[member.role]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {members.length === 0 && (
        <div className="border border-dashed border-[#30363d] rounded-lg py-16 text-center">
          <Users size={32} className="mx-auto text-[#484f58] mb-3" />
          <p className="text-sm font-medium text-[#e6edf3]">No team members</p>
          <p className="text-xs text-[#7d8590] mt-1">
            Add your first team member to get started
          </p>
        </div>
      )}
    </div>
  )
}