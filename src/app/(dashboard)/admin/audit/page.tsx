// @ts-nocheck
import { redirect }      from "next/navigation"
import { getSession }    from "@/lib/auth"
import { prisma }        from "@/lib/prisma"
import { formatDateTime } from "@/lib/utils"
import {
  Shield, User, Home, Wallet,
  FileText, Users, ArrowLeft,
} from "lucide-react"
import Link from "next/link"

type Props = {
  searchParams: Promise<{
    actor?:      string
    entityType?: string
    action?:     string
    page?:       string
  }>
}

const ENTITY_ICONS: Record<string, any> = {
  USER:         User,
  CONTACT:      Users,
  OPPORTUNITY:  ArrowLeft,
  UNIT:         Home,
  PROJECT:      Home,
  LEDGER_ENTRY: Wallet,
  DOCUMENT:     FileText,
  AUTH:         Shield,
  CAMPAIGN:     FileText,
}

const ACTION_COLORS: Record<string, string> = {
  CONTACT_CREATED:        "text-[#3fb950]",
  PROJECT_CREATED:        "text-[#3fb950]",
  UNIT_CREATED:           "text-[#3fb950]",
  UNIT_TYPE_CREATED:      "text-[#3fb950]",
  USER_CREATED:           "text-[#3fb950]",
  LEDGER_ENTRY_CREATED:   "text-[#3fb950]",
  DOCUMENT_UPLOADED:      "text-[#3fb950]",
  NOTE_ADDED:             "text-[#3fb950]",
  UNIT_ASSIGNED:          "text-[#3fb950]",
  CAMPAIGN_CREATED:       "text-[#3fb950]",
  CAMPAIGN_SENT:          "text-[#3fb950]",
  STAGE_MOVED_TO_AMBER:   "text-[#d29922]",
  STAGE_MOVED_TO_CLOSED:  "text-[#58a6ff]",
  STAGE_MOVED_TO_PAST:    "text-[#a371f7]",
  RESERVATION_EXTENDED:   "text-[#d29922]",
  PAYMENT_MARKED_PAID:    "text-[#3fb950]",
  STAGE_CANCELLED:        "text-[#f85149]",
  STAGE_EXPIRED:          "text-[#f85149]",
  USER_DEACTIVATED:       "text-[#f85149]",
  DOCUMENT_DELETED:       "text-[#f85149]",
  LEDGER_ENTRY_DELETED:   "text-[#f85149]",
  LOGIN_SUCCESS:          "text-[#3fb950]",
  LOGIN_FAILED:           "text-[#f85149]",
  LOGOUT:                 "text-[#7d8590]",
  OTP_SENT:               "text-[#58a6ff]",
  OTP_FAILED:             "text-[#f85149]",
  USER_UPDATED:           "text-[#d29922]",
  USER_PASSWORD_RESET:    "text-[#d29922]",
  UNIT_STATUS_CHANGED:    "text-[#d29922]",
}

const PAGE_SIZE = 50

export default async function AuditPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "ADMIN" && session.role !== "GENERAL_MANAGER") {
    redirect("/contacts")
  }

  const params     = await searchParams
  const actor      = params.actor      ?? ""
  const entityType = params.entityType ?? ""
  const action     = params.action     ?? ""
  const page       = parseInt(params.page ?? "1")
  const skip       = (page - 1) * PAGE_SIZE

  const where = {
    ...(actor      && { actorName: { contains: actor, mode: "insensitive" as any } }),
    ...(entityType && { entityType }),
    ...(action     && { action }),
  }

  const [logs, total, actors, entityTypes, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:    PAGE_SIZE,
      skip,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["actorName"],
      select:   { actorName: true },
      orderBy:  { actorName: "asc" },
    }),
    prisma.auditLog.findMany({
      distinct: ["entityType"],
      select:   { entityType: true },
      orderBy:  { entityType: "asc" },
    }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select:   { action: true },
      orderBy:  { action: "asc" },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    if (actor)      p.set("actor",      actor)
    if (entityType) p.set("entityType", entityType)
    if (action)     p.set("action",     action)
    if (page > 1)   p.set("page",       String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v)
      else   p.delete(k)
    })
    const str = p.toString()
    return `/admin/audit${str ? `?${str}` : ""}`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Audit Log</h1>
          <p className="text-sm text-[#7d8590] mt-0.5">
            {total.toLocaleString()} event{total !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Shield size={20} className="text-[#484f58]" />
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-2">
        <select
          name="actor"
          defaultValue={actor}
          onChange="this.form.submit()"
          className="h-8 px-2 text-xs bg-[#161b22] border border-[#30363d] rounded-md text-[#e6edf3] focus:outline-none focus:border-[#1f6feb]"
        >
          <option value="">All actors</option>
          {actors.map((a) => (
            <option key={a.actorName} value={a.actorName}>
              {a.actorName}
            </option>
          ))}
        </select>

        <select
          name="entityType"
          defaultValue={entityType}
          onChange="this.form.submit()"
          className="h-8 px-2 text-xs bg-[#161b22] border border-[#30363d] rounded-md text-[#e6edf3] focus:outline-none focus:border-[#1f6feb]"
        >
          <option value="">All entities</option>
          {entityTypes.map((e) => (
            <option key={e.entityType} value={e.entityType}>
              {e.entityType}
            </option>
          ))}
        </select>

        <select
          name="action"
          defaultValue={action}
          onChange="this.form.submit()"
          className="h-8 px-2 text-xs bg-[#161b22] border border-[#30363d] rounded-md text-[#e6edf3] focus:outline-none focus:border-[#1f6feb]"
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a.action} value={a.action}>
              {a.action}
            </option>
          ))}
        </select>

        {(actor || entityType || action) && (
          <Link
            href="/admin/audit"
            className="h-8 px-3 text-xs border border-[#30363d] rounded-md text-[#7d8590] hover:text-[#e6edf3] hover:border-[#484f58] flex items-center"
          >
            Clear filters
          </Link>
        )}
      </form>

      {/* Log table */}
      <div className="border border-[#30363d] rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[160px_1fr_140px_120px_100px] gap-4 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
          <span className="text-[10px] font-medium text-[#484f58] uppercase tracking-wider">When</span>
          <span className="text-[10px] font-medium text-[#484f58] uppercase tracking-wider">Action</span>
          <span className="text-[10px] font-medium text-[#484f58] uppercase tracking-wider">Actor</span>
          <span className="text-[10px] font-medium text-[#484f58] uppercase tracking-wider">Entity</span>
          <span className="text-[10px] font-medium text-[#484f58] uppercase tracking-wider">IP</span>
        </div>

        {logs.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Shield size={24} className="mx-auto text-[#484f58] mb-3" />
            <p className="text-sm text-[#7d8590]">No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#21262d]">
            {logs.map((log) => {
              const Icon        = ENTITY_ICONS[log.entityType] ?? Shield
              const color       = ACTION_COLORS[log.action]    ?? "text-[#7d8590]"
              const metadata    = log.metadata as Record<string, any> | null
              const actionLabel = log.action.replace(/_/g, " ")

              return (
                <div
                  key={log.id}
                  className="flex flex-col md:grid md:grid-cols-[160px_1fr_140px_120px_100px] gap-2 md:gap-4 px-4 py-3 bg-[#0d1117] hover:bg-[#161b22] transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-[10px] text-[#484f58] font-mono">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <p className={`text-xs font-medium ${color}`}>
                      {actionLabel}
                    </p>
                    {metadata && (
                      <p className="text-[10px] text-[#484f58] truncate">
                        {Object.entries(metadata)
                          .filter(([, v]) => v !== null && v !== undefined && v !== false)
                          .slice(0, 3)
                          .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-4 h-4 rounded-full bg-[#1f6feb] flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-white">
                        {log.actorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#e6edf3] truncate">{log.actorName}</p>
                      <p className="text-[10px] text-[#484f58] capitalize">
                        {log.actorRole.toLowerCase().replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Icon size={12} className="text-[#484f58] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#7d8590]">{log.entityType}</p>
                      <p className="text-[10px] text-[#484f58] font-mono truncate">
                        {log.entityId.slice(-8)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-[10px] text-[#484f58] font-mono">
                      {log.ipAddress ?? "—"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#7d8590]">
            Page {page} of {totalPages} · {total} total events
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="h-7 px-3 text-xs border border-[#30363d] rounded-md text-[#7d8590] hover:text-[#e6edf3] hover:border-[#484f58] flex items-center"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="h-7 px-3 text-xs border border-[#30363d] rounded-md text-[#7d8590] hover:text-[#e6edf3] hover:border-[#484f58] flex items-center"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}