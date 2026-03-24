"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, 
  Wallet, Settings2, ShieldUser, Building2 
} from "lucide-react";

// Updated to match your actual folder structure
const navItems = [
  { name: "HQ", href: "/", icon: LayoutDashboard },
  { name: "Developments", href: "/admin/projects", icon: Building2 },
  { name: "Master Registry", href: "/contacts", icon: Users },
];

const accountingItems = [
  { name: "Central Ledger", href: "/ledger", icon: Wallet },
];

const adminItems = [
  { name: "Team Control", href: "/admin/team", icon: ShieldUser },
];

export function Sidebar() {
  const pathname = usePathname();

  const NavLink = ({ item }: { item: any }) => {
    // Exact match for home, startsWith for others to keep parent link active
    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-[11px] uppercase tracking-wider ${
          isActive 
            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <item.icon className={`w-4 h-4 ${isActive ? "text-blue-100" : "text-slate-500"}`} />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 fixed inset-y-0 left-0 flex flex-col z-20 border-r border-slate-800 shadow-2xl">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-black">PP</div>
          <span className="text-sm font-black text-white tracking-widest uppercase">Property Pilot</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-10 overflow-y-auto no-scrollbar">
        {/* OPERATIONS: The Revenue Engine */}
        <div className="space-y-2">
          <p className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Operations</p>
          {navItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {/* FINANCE: Post-Closing Management */}
        <div className="space-y-2">
          <p className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Finance</p>
          {accountingItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {/* SYSTEM: Infrastructure */}
        <div className="space-y-2">
          <p className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Settings2 className="w-3 h-3" /> System Admin
          </p>
          {adminItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 text-[9px] text-slate-600 font-black text-center bg-slate-950 uppercase tracking-[0.3em]">
        ERP Terminal v1.2
      </div>
    </aside>
  );
}