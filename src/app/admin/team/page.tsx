import prisma from "@/lib/prisma";
import { createStaff } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, Mail, UserPlus } from "lucide-react";

export default async function AdminTeamPage() {
  const users = await prisma.user.findMany({ orderBy: { role: 'asc' } });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Administration</h1>
          <p className="text-sm text-slate-500">Manage staff roles to enable lead assignment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM COLUMN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit sticky top-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add New Staff
          </h2>
          <form action={createStaff} className="space-y-4">
            <input name="name" placeholder="Full Name" className="w-full border rounded-lg px-3 py-2.5 text-sm" required />
            <input name="email" type="email" placeholder="Email Address" className="w-full border rounded-lg px-3 py-2.5 text-sm" required />
            <select name="role" className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white">
              <option value="SALES">Sales Agent</option>
              <option value="ACCOUNTS">Accountant</option>
              <option value="ADMIN">Administrator</option>
            </select>
            <Button type="submit" className="w-full bg-slate-900 text-white font-bold py-5">
              Onboard Member
            </Button>
          </form>
        </div>

        {/* LIST COLUMN */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{user.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}