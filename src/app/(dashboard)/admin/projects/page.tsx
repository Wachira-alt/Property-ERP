// src/app/admin/projects/page.tsx
import prisma from "@/lib/prisma";
import { createProject, createUnitType, createUnits } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { MapPin, Layers, Building2 } from "lucide-react";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { 
      unitTypes: {
        include: { units: { orderBy: { unitNumber: "asc" } } }
      } 
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8 p-8">
      {/* PROJECT REGISTRATION */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Inventory Command</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Register Estates and Categories</p>
        </div>
        <form action={createProject} className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <input name="name" placeholder="Project Name" className="bg-transparent px-4 py-2 text-sm outline-none w-48 border-r border-slate-200" required />
          <input name="location" placeholder="Location" className="bg-transparent px-4 py-2 text-sm outline-none w-48" required />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] px-8 rounded-xl">Add Project</Button>
        </form>
      </div>

      {/* STOCK MAP GRID */}
      <div className="grid grid-cols-1 gap-10">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{project.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 flex items-center uppercase tracking-widest mt-1">
                    <MapPin className="w-3 h-3 mr-1 text-blue-500" /> {project.location}
                  </p>
                </div>
              </div>
              <form action={createUnitType} className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <input type="hidden" name="projectId" value={project.id} />
                <input name="name" placeholder="New Category (e.g. 2BR)" className="px-3 py-1 text-xs outline-none w-40" required />
                <Button size="sm" className="bg-slate-900 text-white text-[9px] font-black uppercase">Add Category</Button>
              </form>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {project.unitTypes.map(type => (
                <div key={type.id} className="bg-slate-50/30 rounded-3xl p-6 border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <h4 className="font-black text-slate-800 text-sm uppercase italic tracking-tight">{type.name}</h4>
                    </div>
                  </div>

                  <form action={createUnits} className="mb-6 flex gap-2">
                    <input type="hidden" name="unitTypeId" value={type.id} />
                    <input name="unitNumbers" placeholder="IDs (e.g. A1, A2, A3)" className="flex-1 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 transition-colors bg-white shadow-inner" required />
                    <Button type="submit" size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 font-black text-[9px] uppercase transition-all px-4">Register</Button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    {type.units.map(unit => (
                      <div key={unit.id} className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border-2 transition-all cursor-default
                        ${unit.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_4px_10px_rgba(16,185,129,0.1)]' : 
                          unit.status === 'RESERVED' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          'bg-blue-50 text-blue-600 border-blue-100'}`}
                      >
                        {unit.unitNumber}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}