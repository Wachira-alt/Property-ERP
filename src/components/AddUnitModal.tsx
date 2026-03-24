"use client";

import { useState } from "react";
import { Plus, Hash, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createUnits } from "@/app/actions/admin";

interface Project {
  id: string;
  name: string;
  unitTypes: {
    id: string;
    name: string;
  }[];
}

export function AddUnitModal({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Units
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Register Inventory</DialogTitle>
          <DialogDescription className="text-slate-500">
            Select a project category and enter the physical unit numbers.
          </DialogDescription>
        </DialogHeader>

        <form 
          action={async (formData) => {
            await createUnits(formData);
            setOpen(false);
          }} 
          className="space-y-4 mt-4"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Unit Category
            </label>
            <select 
              name="unitTypeId" 
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" 
              required
            >
              <option value="">Select a Project Type...</option>
              {projects.map((project) => (
                <optgroup key={project.id} label={project.name.toUpperCase()}>
                  {project.unitTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {project.name} - {type.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Unit Numbers (Comma Separated)
            </label>
            <textarea
              name="unitNumbers"
              placeholder="e.g. B1, B2, B3, B4"
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-[10px] text-slate-400 italic">
              Separate numbers with commas. Example: A101, A102, B201
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Completion Date (Reference)
            </label>
            <div className="relative">
              <input
                type="date"
                name="completionDate"
                className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1 font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-slate-900 text-white font-bold"
            >
              Save Units
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}