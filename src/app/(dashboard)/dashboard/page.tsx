import { redirect }          from "next/navigation"
import { getSession }        from "@/lib/auth"
import { getDashboardData }  from "@/actions/dashboard"
import { formatCurrency, formatDate, getDaysRemaining } from "@/lib/utils"
import {
  Users, Home, Wallet, TrendingUp,
  AlertTriangle, Clock, CheckCircle2,
  ArrowRight, Building2, UserCheck,
  Activity, Target,
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  // Only GM and Admin see this
  if (session.role !== "GENERAL_MANAGER" && session.role !== "ADMIN") {
    redirect("/contacts")
  }

  const d = await getDashboardData()

  const collectionRate = d.finance.totalScheduled > 0
    ? Math.round((d.finance.totalPaid / d.finance.totalScheduled) * 100)
    : 0

  const conversionRate = d.pipeline.total > 0
    ? Math.round(((d.pipeline.closed + d.pipeline.past) / d.pipeline.total) * 100)
    : 0

  const inventoryUtilisation = d.inventory.total > 0
    ? Math.round(((d.inventory.reserved + d.inventory.sold) / d.inventory.total) * 100)
    : 0

  return (
    <div className="space-y-6 max-w-[1280px]">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Dashboard</h1>
        <p className="text-sm text-[#7d8590] mt-0.5">
          Good morning, {session.name.split(" ")[0]} — here is today's overview
        </p>
      </div>

      {/* ── Top KPI strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total revenue collected"
          value={formatCurrency(d.finance.totalPaid)}
          sub={`${collectionRate}% of ${formatCurrency(d.finance.totalScheduled)} scheduled`}
          icon={<Wallet size={15} className="text-[#3fb950]" />}
          accent="green"
        />
        <KPICard
          label="Outstanding balance"
          value={formatCurrency(d.finance.totalScheduled - d.finance.totalPaid)}
          sub={d.finance.totalOverdue > 0
            ? `${formatCurrency(d.finance.totalOverdue)} overdue`
            : "No overdue payments"}
          icon={<TrendingUp size={15} className="text-[#d29922]" />}
          accent={d.finance.totalOverdue > 0 ? "amber" : "neutral"}
        />
        <KPICard
          label="Active pipeline"
          value={String(d.pipeline.green + d.pipeline.amber)}
          sub={`${d.pipeline.green} leads · ${d.pipeline.amber} reserved`}
          icon={<Users size={15} className="text-[#58a6ff]" />}
          accent="blue"
        />
        <KPICard
          label="Units available"
          value={String(d.inventory.available)}
          sub={`of ${d.inventory.total} total · ${d.inventory.sold} sold`}
          icon={<Home size={15} className="text-[#a371f7]" />}
          accent="purple"
        />
      </div>

      {/* ── Row 2: Pipeline funnel + Alerts ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Pipeline funnel */}
        <div className="lg:col-span-2 border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
          <SectionHeader
            title="Sales pipeline"
            sub={`${d.pipeline.total} total opportunities`}
            href="/contacts"
          />
          <div className="p-5 space-y-3">
            {[
              {
                stage: "GREEN",
                label: "Leads",
                count: d.pipeline.green,
                color: "bg-[#3fb950]",
                bg:    "bg-[#1a4f2a]",
                text:  "text-[#3fb950]",
              },
              {
                stage: "AMBER",
                label: "Reservations",
                count: d.pipeline.amber,
                color: "bg-[#d29922]",
                bg:    "bg-[#4a3000]",
                text:  "text-[#d29922]",
              },
              {
                stage: "CLOSED",
                label: "Closed — paying",
                count: d.pipeline.closed,
                color: "bg-[#58a6ff]",
                bg:    "bg-[#0d2a4a]",
                text:  "text-[#58a6ff]",
              },
              {
                stage: "PAST",
                label: "Fully paid",
                count: d.pipeline.past,
                color: "bg-[#a371f7]",
                bg:    "bg-[#2d1f5e]",
                text:  "text-[#a371f7]",
              },
            ].map((row) => {
              const pct = d.pipeline.total > 0
                ? Math.round((row.count / d.pipeline.total) * 100)
                : 0
              return (
                <div key={row.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${row.color}`} />
                      <span className="text-[#e6edf3]">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${row.text}`}>
                        {row.count}
                      </span>
                      <span className="text-[#484f58] w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Conversion rate */}
            <div className="pt-3 border-t border-[#21262d] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#7d8590]">
                <Target size={12} />
                <span>Pipeline conversion rate</span>
              </div>
              <span className={`font-semibold ${
                conversionRate >= 30
                  ? "text-[#3fb950]"
                  : conversionRate >= 15
                  ? "text-[#d29922]"
                  : "text-[#f85149]"
              }`}>
                {conversionRate}%
              </span>
            </div>

            {/* Expired / Cancelled */}
            {(d.pipeline.expired > 0 || d.pipeline.cancelled > 0) && (
              <div className="flex items-center gap-4 text-xs text-[#484f58]">
                {d.pipeline.expired > 0 && (
                  <span>{d.pipeline.expired} expired</span>
                )}
                {d.pipeline.cancelled > 0 && (
                  <span>{d.pipeline.cancelled} cancelled</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alerts panel */}
        <div className="space-y-4">
          {/* Expiring reservations */}
          <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
            <SectionHeader
              title="Expiring soon"
              sub="Reservations within 7 days"
              icon={<Clock size={13} className="text-[#d29922]" />}
            />
            <div className="divide-y divide-[#21262d]">
              {d.expiringReservations.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <CheckCircle2 size={16} className="mx-auto text-[#3fb950] mb-1.5" />
                  <p className="text-xs text-[#7d8590]">No reservations expiring</p>
                </div>
              ) : (
                d.expiringReservations.slice(0, 5).map((unit) => {
                  const days = getDaysRemaining(unit.reservedUntil)
                  const contact = unit.opportunity?.contact
                  return (
                    <div key={unit.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#e6edf3] truncate">
                            {contact
                              ? `${contact.firstName} ${contact.lastName}`
                              : "—"}
                          </p>
                          <p className="text-[10px] text-[#484f58]">
                            {unit.name} · {unit.unitType.project.name}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold shrink-0 ${
                          days !== null && days <= 2
                            ? "text-[#f85149]"
                            : "text-[#d29922]"
                        }`}>
                          {days !== null ? `${days}d` : "—"}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Overdue payments */}
          <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
            <SectionHeader
              title="Overdue payments"
              sub={`${d.overdueEntries.length} entries`}
              icon={<AlertTriangle size={13} className="text-[#f85149]" />}
              href="/finance"
            />
            <div className="divide-y divide-[#21262d]">
              {d.overdueEntries.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <CheckCircle2 size={16} className="mx-auto text-[#3fb950] mb-1.5" />
                  <p className="text-xs text-[#7d8590]">No overdue payments</p>
                </div>
              ) : (
                d.overdueEntries.slice(0, 4).map((entry) => {
                  const contact = entry.opportunity.contact
                  return (
                    <Link
                      key={entry.id}
                      href={`/contacts/${contact.id}`}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-[#21262d] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#e6edf3] truncate">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-[10px] text-[#484f58] truncate">
                          {entry.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#f85149] shrink-0">
                        {formatCurrency(Number(entry.amount))}
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Inventory + Finance breakdown ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Inventory by project */}
        <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
          <SectionHeader
            title="Inventory by project"
            sub={`${d.inventory.available} available · ${inventoryUtilisation}% utilised`}
            href="/inventory"
          />
          <div className="divide-y divide-[#21262d]">
            {d.projects.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Building2 size={20} className="mx-auto text-[#484f58] mb-2" />
                <p className="text-xs text-[#7d8590]">No projects found</p>
              </div>
            ) : (
              d.projects.map((project) => (
                <div key={project.id} className="px-5 py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[#e6edf3]">
                      {project.name}
                    </p>
                    <span className="text-[10px] text-[#484f58]">
                      {project.total} units
                    </span>
                  </div>

                  {/* Stacked bar */}
                  {project.total > 0 && (
                    <div className="h-2 bg-[#21262d] rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-[#3fb950]"
                        style={{ width: `${(project.available / project.total) * 100}%` }}
                      />
                      <div
                        className="h-full bg-[#d29922]"
                        style={{ width: `${(project.reserved / project.total) * 100}%` }}
                      />
                      <div
                        className="h-full bg-[#f85149]"
                        style={{ width: `${(project.sold / project.total) * 100}%` }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-[#7d8590]">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                      {project.available} available
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d29922]" />
                      {project.reserved} reserved
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f85149]" />
                      {project.sold} sold
                    </span>
                    <span className="ml-auto font-medium text-[#e6edf3]">
                      {project.soldPct}% sold
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Finance breakdown */}
        <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
          <SectionHeader
            title="Finance overview"
            sub="Payment collection summary"
            href="/finance"
          />
          <div className="p-5 space-y-5">
            {/* Collection progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#7d8590]">Collection rate</span>
                <span className={`font-semibold ${
                  collectionRate >= 70 ? "text-[#3fb950]" :
                  collectionRate >= 40 ? "text-[#d29922]" :
                  "text-[#f85149]"
                }`}>
                  {collectionRate}%
                </span>
              </div>
              <div className="h-3 bg-[#21262d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3fb950] rounded-full transition-all"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#484f58]">
                <span>KES 0</span>
                <span>{formatCurrency(d.finance.totalScheduled)}</span>
              </div>
            </div>

            {/* Finance stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total scheduled",
                  value: formatCurrency(d.finance.totalScheduled),
                  color: "text-[#e6edf3]",
                },
                {
                  label: "Collected",
                  value: formatCurrency(d.finance.totalPaid),
                  color: "text-[#3fb950]",
                },
                {
                  label: "Outstanding",
                  value: formatCurrency(
                    d.finance.totalScheduled - d.finance.totalPaid
                  ),
                  color: "text-[#d29922]",
                },
                {
                  label: "Overdue",
                  value: formatCurrency(d.finance.totalOverdue),
                  color: d.finance.totalOverdue > 0
                    ? "text-[#f85149]"
                    : "text-[#3fb950]",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2.5"
                >
                  <p className="text-[10px] text-[#7d8590]">{stat.label}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent payments */}
            {d.recentPayments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-[#7d8590] uppercase tracking-wider">
                  Recent payments (7 days)
                </p>
                <div className="space-y-1.5">
                  {d.recentPayments.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 size={11} className="text-[#3fb950] shrink-0" />
                        <span className="text-[#7d8590] truncate">
                          {p.opportunity.contact.firstName}{" "}
                          {p.opportunity.contact.lastName}
                        </span>
                      </div>
                      <span className="text-[#3fb950] font-medium shrink-0 ml-2">
                        +{formatCurrency(Number(p.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Team performance ───────────────────────────────────────── */}
      <div className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden">
        <SectionHeader
          title="Team performance"
          sub="Ranked by closed deals"
          href="/admin/team"
          icon={<UserCheck size={13} className="text-[#58a6ff]" />}
        />
        {d.team.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Users size={20} className="mx-auto text-[#484f58] mb-2" />
            <p className="text-xs text-[#7d8590]">No team activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#21262d]">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px_120px_80px] gap-4 px-5 py-2 bg-[#0d1117]">
              {["Agent", "Total leads", "In amber", "Closed", "Conversion", ""].map(
                (h) => (
                  <span key={h} className="text-[10px] font-medium text-[#484f58] uppercase tracking-wider">
                    {h}
                  </span>
                )
              )}
            </div>

            {d.team.map((member, idx) => (
              <div
                key={member.id}
                className="flex flex-col sm:grid sm:grid-cols-[1fr_100px_100px_100px_120px_80px] gap-2 sm:gap-4 px-5 py-3.5 bg-[#0d1117] hover:bg-[#161b22] transition-colors"
              >
                {/* Agent */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rank */}
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    idx === 0
                      ? "bg-[#d29922] text-[#0d1117]"
                      : idx === 1
                      ? "bg-[#7d8590] text-[#0d1117]"
                      : idx === 2
                      ? "bg-[#9e6a03] text-[#0d1117]"
                      : "bg-[#21262d] text-[#484f58]"
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#e6edf3] truncate">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-[#484f58] capitalize">
                      {member.role.toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                </div>

                {/* Total leads */}
                <div className="flex items-center">
                  <span className="text-xs text-[#e6edf3]">{member.total}</span>
                </div>

                {/* Amber */}
                <div className="flex items-center">
                  <span className="text-xs text-[#d29922]">{member.amber}</span>
                </div>

                {/* Closed */}
                <div className="flex items-center">
                  <span className="text-xs text-[#3fb950] font-medium">
                    {member.closed}
                  </span>
                </div>

                {/* Conversion bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        member.conversion >= 30
                          ? "bg-[#3fb950]"
                          : member.conversion >= 15
                          ? "bg-[#d29922]"
                          : "bg-[#f85149]"
                      }`}
                      style={{ width: `${Math.min(member.conversion, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#7d8590] w-7 text-right">
                    {member.conversion}%
                  </span>
                </div>

                {/* Activity indicator */}
                <div className="flex items-center">
                  <div className="flex items-center gap-1">
                    <Activity size={11} className="text-[#484f58]" />
                    <span className="text-[10px] text-[#484f58]">
                      {member.total > 0 ? "Active" : "Idle"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label:  string
  value:  string
  sub:    string
  icon:   React.ReactNode
  accent: "green" | "amber" | "blue" | "purple" | "red" | "neutral"
}) {
  const borders = {
    green:   "border-[#2ea04333]",
    amber:   "border-[#9e6a0333]",
    blue:    "border-[#1f6feb33]",
    purple:  "border-[#6e40c933]",
    red:     "border-[#da363333]",
    neutral: "border-[#30363d]",
  }

  return (
    <div className={`border ${borders[accent]} rounded-lg bg-[#161b22] px-4 py-4`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-[#7d8590]">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-[#e6edf3] leading-none">
        {value}
      </p>
      <p className="text-[11px] text-[#484f58] mt-1.5">{sub}</p>
    </div>
  )
}

function SectionHeader({
  title,
  sub,
  href,
  icon,
}: {
  title: string
  sub:   string
  href?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="px-5 py-3.5 border-b border-[#30363d] flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="text-sm font-medium text-[#e6edf3]">{title}</p>
          <p className="text-[11px] text-[#7d8590]">{sub}</p>
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-[11px] text-[#7d8590] hover:text-[#58a6ff] transition-colors"
        >
          View all
          <ArrowRight size={11} />
        </Link>
      )}
    </div>
  )
}