import prisma from "@/lib/prisma";
import { createProject } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Plus } from "lucide-react";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { _count: { select: { properties: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Administration</h1>
          <p className="text-sm text-slate-500">Add new developments to enable inventory entry.</p>
        </div>
        
        {/* Quick Add Form */}
        <form action={createProject} className="flex gap-2">
          <input name="name" placeholder="Project Name" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
          <input name="location" placeholder="Location" className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <Button type="submit" className="bg-blue-600 text-white font-bold">
            <Plus className="w-4 h-4 mr-2" /> Add Project
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map(project => (
          <div key={project.id} className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">{project.name}</h3>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" /> {project.location || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                {project._count.properties} Units
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}