"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, TrendingUp, Wallet, Megaphone } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/properties", icon: Building2 },
  { name: "Master Registry", href: "/contacts", icon: Users },
  { name: "Pipeline", href: "/opportunities", icon: TrendingUp },
  { name: "Ledger", href: "/ledger", icon: Wallet },
  { name: "Marketing Hub", href: "/marketing", icon: Megaphone }, // <-- NEW LINK
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 fixed inset-y-0 left-0 flex flex-col z-20 shadow-xl">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <span className="text-xl font-extrabold text-white tracking-tight">Property Pilot</span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          // Strict exact match for Dashboard, partial match for others
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-blue-200" : "text-slate-400 group-hover:text-slate-300"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 font-medium text-center bg-slate-950">
        Property Pilot ERP v1.0
      </div>
    </aside>
  );
}