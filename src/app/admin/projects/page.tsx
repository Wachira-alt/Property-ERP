import prisma from "@/lib/prisma";
import { createProject, createUnitType, createUnits } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Hash, LayoutGrid } from "lucide-react";

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
    <div className="space-y-8">
      {/* 1. TOP BAR: CREATE PROJECT */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Development Control</h1>
          <p className="text-sm text-slate-500">Register new estates and define their unit categories.</p>
        </div>
        <form action={createProject} className="flex gap-2">
          <input name="name" placeholder="Project Name (e.g. Bustani)" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
          <input name="location" placeholder="Location" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <Button type="submit" className="bg-blue-600 text-white font-bold px-6">Add Project</Button>
        </form>
      </div>

      {/* 2. PROJECT LIST */}
      <div className="grid grid-cols-1 gap-8">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header: Project Info + Add Category Form */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">{project.name}</h3>
                <p className="text-xs text-slate-500 flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-1" /> {project.location}
                </p>
              </div>
              <form action={createUnitType} className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200">
                <input type="hidden" name="projectId" value={project.id} />
                <input name="name" placeholder="New Category (e.g. Studio)" className="px-3 py-1 text-xs outline-none w-40" required />
                <Button size="sm" className="bg-slate-900 text-white text-[10px] font-bold uppercase">Add Category</Button>
              </form>
            </div>

            {/* Content: The Unit Types and their Units */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.unitTypes.map(type => (
                <div key={type.id} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-blue-600 text-sm uppercase tracking-widest">{type.name}</h4>
                    <span className="text-[10px] font-black text-slate-400 bg-white border px-2 py-1 rounded-md">
                      {type.units.length} UNITS TOTAL
                    </span>
                  </div>

                  {/* BATCH ADD UNITS FORM */}
                  <form action={createUnits} className="mb-4 flex gap-2">
                    <input type="hidden" name="unitTypeId" value={type.id} />
                    <input type="hidden" name="redirectPath" value="/admin/projects" />
                    <input 
                      name="unitNumbers" 
                      placeholder="Enter Unit IDs (B1, B2, B3...)" 
                      className="flex-1 border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                    <Button type="submit" size="sm" variant="outline" className="border-blue-200 text-blue-600 font-bold text-[10px]">
                      REGISTER BATCH
                    </Button>
                  </form>

                  {/* SCROLLABLE UNIT CHIPS */}
                  <div className="flex flex-wrap gap-1.5">
                    {type.units.map(unit => (
                      <div key={unit.id} className={`px-2 py-1 rounded text-[10px] font-bold border ${
                        unit.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {unit.unitNumber}
                      </div>
                    ))}
                    {type.units.length === 0 && <p className="text-[10px] text-slate-400 italic">No units registered yet.</p>}
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