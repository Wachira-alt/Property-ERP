// @ts-nocheck
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Users,
  LayoutGrid,
  Wallet,
  Megaphone,
  Settings,
  UserCog,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  // Shield,
  MoreHorizontal,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { SessionUser } from "@/types/auth"
import type { Action } from "@/lib/permissions"
import { canPerform } from "@/lib/permissions"

type NavItem = {
  label:           string
  href:            string
  icon:            React.ElementType
  requiredAction?: Action
}

const NAV_ITEMS: NavItem[] = [
  {
    label:          "Dashboard",
    href:           "/dashboard",
    icon:           LayoutDashboard,
    requiredAction: "EXTEND_RESERVATION",
  },
  { label: "Contacts",  href: "/contacts",  icon: Users },
  { label: "Inventory", href: "/inventory", icon: LayoutGrid, requiredAction: "MANAGE_INVENTORY" },
  { label: "Finance",   href: "/finance",   icon: Wallet,     requiredAction: "VIEW_FINANCE" },
  { label: "Marketing", href: "/marketing", icon: Megaphone,  requiredAction: "SEND_CAMPAIGN" },
]

const ADMIN_ITEMS: NavItem[] = [
  {
    label:          "Team",
    href:           "/admin/team",
    icon:           UserCog,
    requiredAction: "MANAGE_TEAM",
  },
  {
    label:          "Projects",
    href:           "/admin/projects",
    icon:           Settings,
    requiredAction: "MANAGE_INVENTORY",
  },
  // {
  //   label:          "Audit Log",
  //   href:           "/admin/audit",
  //   icon:           Shield,
  //   requiredAction: "MANAGE_TEAM",
  // },
]

// ── Desktop nav link ──────────────────────────────────────────────────────────
function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const Icon     = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-100 group",
        isActive
          ? "bg-[#21262d] text-[#e6edf3] font-medium"
          : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
      )}
    >
      <Icon
        size={16}
        className={cn(
          "shrink-0 transition-colors",
          isActive ? "text-[#e6edf3]" : "text-[#7d8590] group-hover:text-[#e6edf3]"
        )}
      />
      <span>{item.label}</span>
      {isActive && <ChevronRight size={14} className="ml-auto text-[#7d8590]" />}
    </Link>
  )
}

// ── Desktop sidebar content ───────────────────────────────────────────────────
function SidebarContent({ user }: { user: SessionUser }) {
  const router                      = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const visibleNav   = NAV_ITEMS.filter((item) => !item.requiredAction || canPerform(user.role, item.requiredAction))
  const visibleAdmin = ADMIN_ITEMS.filter((item) => !item.requiredAction || canPerform(user.role, item.requiredAction))

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch("/api/auth", { method: "DELETE" })
      router.push("/login")
      router.refresh()
    } catch {
      toast.error("Failed to log out")
      setLoggingOut(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#21262d]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md overflow-hidden bg-white shrink-0 flex items-center justify-center">
            <Image
              src="/company_lo.png"
              alt="Home Bridge"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#e6edf3] truncate leading-tight">
              Home Bridge
            </p>
            <p className="text-[11px] text-[#7d8590] truncate leading-tight capitalize">
              {user.role.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {visibleNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {visibleAdmin.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[11px] font-medium text-[#7d8590] uppercase tracking-wider">
                Admin
              </p>
            </div>
            {visibleAdmin.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-[#21262d] px-3 py-3 space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md">
          <div className="w-6 h-6 rounded-full bg-[#1f6feb] flex items-center justify-center shrink-0">
            <span className="text-[11px] font-semibold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#e6edf3] truncate leading-tight">{user.name}</p>
            <p className="text-[11px] text-[#7d8590] truncate leading-tight">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#7d8590] hover:text-[#f85149] hover:bg-[#21262d] transition-colors duration-100 disabled:opacity-50"
        >
          <LogOut size={16} className="shrink-0" />
          <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
        </button>
      </div>
    </div>
  )
}

// ── Mobile bottom tab bar ─────────────────────────────────────────────────────
function BottomTabBar({ user }: { user: SessionUser }) {
  const pathname                    = usePathname()
  const router                      = useRouter()
  const [moreOpen, setMoreOpen]     = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.requiredAction || canPerform(user.role, item.requiredAction)
  ).slice(0, 4)

  const visibleAdmin = ADMIN_ITEMS.filter(
    (item) => !item.requiredAction || canPerform(user.role, item.requiredAction)
  )

  const isMoreActive =
    !visibleNav.some((item) => pathname === item.href || pathname.startsWith(item.href + "/")) ||
    moreOpen

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch("/api/auth", { method: "DELETE" })
      router.push("/login")
      router.refresh()
    } catch {
      toast.error("Failed to log out")
      setLoggingOut(false)
      setConfirmLogout(false)
    }
  }

  function handleTabTap() {
    // Haptic feedback — subtle, 10ms, barely perceptible
    navigator.vibrate?.(10)
  }

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#010409]/95 backdrop-blur-md border-t border-[#21262d]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon     = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { handleTabTap(); setMoreOpen(false) }}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors active:bg-[#21262d]/60"
              >
                {/* Active pill */}
                <div className={cn(
                  "flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200",
                  isActive ? "bg-[#1f6feb]/20" : "bg-transparent"
                )}>
                  <Icon
                    size={20}
                    className={cn(
                      "transition-colors duration-200",
                      isActive ? "text-[#58a6ff]" : "text-[#484f58]"
                    )}
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  isActive ? "text-[#58a6ff]" : "text-[#484f58]"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* More tab */}
          <button
            onClick={() => { handleTabTap(); setMoreOpen(true) }}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors active:bg-[#21262d]/60"
          >
            <div className={cn(
              "flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200",
              moreOpen ? "bg-[#1f6feb]/20" : "bg-transparent"
            )}>
              <MoreHorizontal
                size={20}
                className={cn(
                  "transition-colors duration-200",
                  moreOpen ? "text-[#58a6ff]" : "text-[#484f58]"
                )}
              />
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-colors duration-200",
              moreOpen ? "text-[#58a6ff]" : "text-[#484f58]"
            )}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More — bottom sheet */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#161b22] rounded-t-2xl border-t border-[#30363d] animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#30363d]" />
            </div>

            {/* User info */}
            <div className="px-4 py-3 border-b border-[#21262d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1f6feb] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#e6edf3] truncate">{user.name}</p>
                  <p className="text-xs text-[#7d8590] truncate">{user.email}</p>
                  <p className="text-[11px] text-[#484f58] capitalize mt-0.5">
                    {user.role.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin nav items */}
            {visibleAdmin.length > 0 && (
              <div className="px-3 py-2">
                <p className="text-[11px] font-medium text-[#484f58] uppercase tracking-wider px-3 py-2">
                  Admin
                </p>
                {visibleAdmin.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon     = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors active:bg-[#21262d]",
                        isActive ? "bg-[#21262d] text-[#e6edf3]" : "text-[#7d8590]"
                      )}
                    >
                      <Icon size={18} className={isActive ? "text-[#58a6ff]" : "text-[#484f58]"} />
                      <span className="text-sm font-medium">{item.label}</span>
                      <ChevronRight size={14} className="ml-auto text-[#484f58]" />
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Divider */}
            <div className="mx-4 border-t border-[#21262d]" />

            {/* Sign out */}
            <div className="px-3 py-2">
              {confirmLogout ? (
                <div className="px-3 py-3 space-y-3">
                  <p className="text-sm text-[#e6edf3] font-medium">Sign out of Home Bridge?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmLogout(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#21262d] text-[#7d8590] active:opacity-70 transition-opacity"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#f85149]/10 text-[#f85149] active:opacity-70 transition-opacity disabled:opacity-40"
                    >
                      {loggingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#f85149] active:bg-[#21262d] transition-colors"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Sign out</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ── Exports ───────────────────────────────────────────────────────────────────
export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <>
      {/* Desktop — fixed left sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[240px] flex-col bg-[#010409] border-r border-[#21262d] z-40">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile — bottom tab bar + more sheet */}
      <BottomTabBar user={user} />
    </>
  )
}