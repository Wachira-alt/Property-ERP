"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Building2, Users, TrendingUp, 
  Wallet, Megaphone, Settings2, ShieldUser, Briefcase 
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/properties", icon: Building2 },
  { name: "Master Registry", href: "/contacts", icon: Users },
  { name: "Pipeline", href: "/opportunities", icon: TrendingUp },
  { name: "Ledger", href: "/ledger", icon: Wallet },
  { name: "Marketing Hub", href: "/marketing", icon: Megaphone },
];

// NEW: Administration items separated for better organization
const adminItems = [
  { name: "Project Registry", href: "/admin/projects", icon: Briefcase },
  { name: "Team Management", href: "/admin/team", icon: ShieldUser },
];

export function Sidebar() {
  const pathname = usePathname();

  const NavLink = ({ item }: { item: any }) => {
    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${
          isActive 
            ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
            : "hover:bg-slate-800 hover:text-white"
        }`}
      >
        <item.icon className={`w-5 h-5 ${isActive ? "text-blue-200" : "text-slate-400"}`} />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 fixed inset-y-0 left-0 flex flex-col z-20 shadow-xl">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <span className="text-xl font-extrabold text-white tracking-tight">Property Pilot</span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto no-scrollbar">
        {/* MAIN OPERATIONS SECTION */}
        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Operations</p>
          {navItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {/* ADMINISTRATION SECTION */}
        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Settings2 className="w-3 h-3" /> Administration
          </p>
          {adminItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 font-medium text-center bg-slate-950">
        Property Pilot ERP v1.0
      </div>
    </aside>
  );
}