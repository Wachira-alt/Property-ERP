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
  Menu,
  X,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { SessionUser } from "@/types/auth"
import type { Action } from "@/lib/permissions"
import { canPerform } from "@/lib/permissions"
import { LayoutDashboard } from "lucide-react"
// import { Shield } from "lucide-react"

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  requiredAction?: Action
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href:  "/dashboard",
    icon:  LayoutDashboard,
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

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const Icon = item.icon

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

function SidebarContent({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const router = useRouter()
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

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {visibleNav.map((item) => (
          <NavLink key={item.href} item={item} onClick={onNavigate} />
        ))}

        {visibleAdmin.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[11px] font-medium text-[#7d8590] uppercase tracking-wider">
                Admin
              </p>
            </div>
            {visibleAdmin.map((item) => (
              <NavLink key={item.href} item={item} onClick={onNavigate} />
            ))}
          </>
        )}
      </nav>

      {/* User footer — safe area bottom so home indicator doesn't cover it */}
      <div
        className="border-t border-[#21262d] px-3 py-3 space-y-0.5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
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

export function Sidebar({ user }: { user: SessionUser }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen w-[240px] flex-col bg-[#010409] border-r border-[#21262d] z-40"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <SidebarContent user={user} />
      </aside>

      {/* ── Mobile top bar ──────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#010409] border-b border-[#21262d]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md overflow-hidden bg-white flex items-center justify-center shrink-0">
              <Image
                src="/company_lo.png"
                alt="Home Bridge"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold text-[#e6edf3]">Home Bridge</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile top bar spacer — h-14 + status bar height */}
      <div
        className="md:hidden h-14"
        style={{ marginTop: 'env(safe-area-inset-top)' }}
      />

      {/* ── Mobile drawer overlay ───────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative w-[240px] h-full bg-[#010409] border-r border-[#21262d] flex flex-col"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div
              className="absolute right-3"
              style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}