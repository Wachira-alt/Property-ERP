import prisma from "@/lib/prisma";
import { 
  Building2, Users, Wallet, 
  ArrowUpRight, TrendingUp, Activity, 
  CheckCircle2, Clock, Zap 
} from "lucide-react";

export default async function DashboardPage() {
  // 1. Fetch Aggregated Intelligence
  const [projects, contacts, opportunities, agents] = await Promise.all([
    prisma.project.findMany({ 
      include: { 
        unitTypes: { 
          include: { units: true } 
        } 
      } 
    }),
    prisma.contact.findMany({ 
      include: { sourcingAgent: true } 
    }),
    prisma.opportunity.findMany({ 
      include: { ledgerEntries: true, unit: true } 
    }),
    prisma.user.findMany({ 
      include: { 
        sourcedContacts: { 
          include: { opportunities: true } 
        } 
      } 
    })
  ]);

  // 2. Compute Metrics
  const totalSalesValue = opportunities.reduce((acc, op) => acc + Number(op.agreedPrice), 0);
  const totalClosed = opportunities.filter(op => op.status === "CLOSED").length;
  const totalAmber = opportunities.filter(op => op.status === "RESERVED").length;
  
  return (
    <div className="space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">Terminal HQ</h1>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mt-4 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Real-Time Property Pilot Telemetry
          </div>
        </div>
        
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">System Status</p>
          {/* FIXED: Changed <p> to <div> to prevent hydration error */}
          <div className="text-sm font-bold text-emerald-500 uppercase flex items-center gap-2 justify-end">
            Live Feed Active 
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
        </div>
      </div>

      {/* QUADRANT 1: THE MONEY MAP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Booked Value" value={`KES ${totalSalesValue.toLocaleString()}`} icon={Wallet} color="text-blue-600" />
        <StatCard title="Active Leads (Green)" value={contacts.length} icon={Users} color="text-emerald-500" />
        <StatCard title="Reservations (Amber)" value={totalAmber} icon={Clock} color="text-amber-500" />
        <StatCard title="Finalized (Blue)" value={totalClosed} icon={CheckCircle2} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* QUADRANT 2: PROJECT & UNIT STATISTICS */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Project Stock Absorption</h3>
          <div className="grid grid-cols-1 gap-4">
            {projects.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">
                No Projects Registered
              </div>
            ) : (
              projects.map(project => {
                const allUnits = project.unitTypes.flatMap(t => t.units);
                const soldUnits = allUnits.filter(u => u.status === "SOLD").length;
                const percent = allUnits.length > 0 ? (soldUnits / allUnits.length) * 100 : 0;
                
                return (
                  <div key={project.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-slate-900">{project.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{allUnits.length} Units in Portfolio</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-blue-600 italic tracking-tighter">{percent.toFixed(0)}% ABSORBED</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden flex p-[2px] border border-slate-100">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                        style={{ width: `${percent}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* QUADRANT 3: AGENT & CONTACT STATISTICS */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Agent Performance Terminal</h3>
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-slate-800">
            <div className="space-y-8">
              {agents.length === 0 ? (
                <p className="text-[9px] text-slate-500 font-black uppercase text-center py-10">Awaiting Agent Enrollment...</p>
              ) : (
                agents.slice(0, 5).map((agent, idx) => {
                  const closedCount = agent.sourcedContacts.filter(c => 
                    c.opportunities.some(o => o.status === "CLOSED")
                  ).length;
                  
                  return (
                    <div key={agent.id} className="flex items-center justify-between group transition-all">
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-slate-700 w-4">0{idx + 1}</div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                            {agent.name || "Anonymous Operative"}
                          </p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mt-1">
                            {agent.sourcedContacts.length} Total Pipeline Contacts
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-white italic tracking-tighter">{closedCount} CLOSED</p>
                        <div className="flex gap-1 mt-1.5 justify-end">
                          {[...Array(Math.min(closedCount, 5))].map((_, i) => (
                            <div key={i} className="w-1 h-1 bg-blue-500 rounded-full" />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-10 pt-6 border-t border-slate-800">
              <button className="w-full py-4 rounded-2xl bg-slate-800 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:bg-blue-600 hover:text-white transition-all border border-slate-700 hover:border-blue-500">
                Access Full Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-default">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl bg-slate-50 ${color} group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-200 group-hover:text-blue-500 transition-colors" />
      </div>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic">{value}</p>
    </div>
  );
}