import prisma from "@/lib/prisma";
import Link from "next/link";
import { AddContactModal } from "@/components/AddContactModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User2, ArrowRight, Inbox } from "lucide-react";

export default async function ContactsPage() {
  const [contacts, agents, projects] = await Promise.all([
    prisma.contact.findMany({
      include: { 
        sourcingAgent: true,
        project: true,
        opportunities: true // Crucial for Stage 2 & 3 visibility
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({
      include: {
        unitTypes: {
          include: {
            units: { where: { status: "AVAILABLE" } }
          }
        }
      },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Master Registry</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold uppercase tracking-widest">Stage 1: Floating Leads & Intake</p>
        </div>
        <AddContactModal agents={agents} projects={projects} />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
              <TableHead className="pl-8 h-14">Client / Source</TableHead>
              <TableHead>Target Project</TableHead>
              <TableHead className="w-[350px]">Pipeline Progress</TableHead>
              <TableHead className="text-right pr-8">Management</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                    <Inbox className="w-12 h-12 text-slate-400" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Registry Empty</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => {
                const activeDeal = contact.opportunities?.[0];
                const status = activeDeal?.status || "LEAD"; // Default is Green

                return (
                  <TableRow key={contact.id} className="group hover:bg-slate-50/80 transition-all border-b border-slate-100 last:border-0">
                    {/* CLIENT INFO */}
                    <TableCell className="pl-8 py-6">
                      <div className="font-black text-slate-900 text-sm tracking-tight">
                        {contact.firstName} {contact.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 flex items-center gap-1">
                        <User2 className="w-3 h-3" /> Agent: {contact.sourcingAgent?.name || "Organic"}
                      </div>
                    </TableCell>
                    
                    {/* PROJECT INFO */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">
                          {contact.project?.name || "Project Unassigned"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                          {contact.interestedUnitId ? `Unit Lock: Pending` : "Unit Choice: Required"}
                        </span>
                      </div>
                    </TableCell>

                    {/* STAGE VISUALIZER */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest px-1">
                          <span className="text-emerald-600">Green</span>
                          <span className={status === "RESERVED" || status === "CLOSED" ? "text-amber-500" : "text-slate-300"}>Amber</span>
                          <span className={status === "CLOSED" ? "text-blue-600" : "text-slate-300"}>Closed</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/50 p-[2px]">
                          {/* Green Segment (Always filled if lead exists) */}
                          <div className="h-full bg-emerald-500 w-1/3 rounded-l-full border-r border-white/20" />
                          
                          {/* Amber Segment */}
                          <div className={`h-full w-1/3 border-r border-white/20 transition-all duration-700 ${
                            status === "RESERVED" || status === "CLOSED" ? 'bg-amber-400' : 'bg-transparent'
                          }`} />
                          
                          {/* Closed Segment */}
                          <div className={`h-full w-1/3 transition-all duration-700 rounded-r-full ${
                            status === "CLOSED" ? 'bg-blue-600' : 'bg-transparent'
                          }`} />
                        </div>
                      </div>
                    </TableCell>

                    {/* ACTION LINK */}
                    <TableCell className="text-right pr-8">
                      <Link 
                        href={`/contacts/${contact.id}`} 
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white group-hover:bg-blue-600 rounded-xl transition-all border border-slate-200 group-hover:border-blue-600 shadow-sm"
                      >
                        Profile <ArrowRight className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}