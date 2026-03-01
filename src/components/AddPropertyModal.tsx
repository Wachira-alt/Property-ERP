"use client";

import { useState } from "react";
import { addProperty } from "@/app/actions";
import { Plus, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AddPropertyModal({ projects }: { projects: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await addProperty(formData);
    setIsPending(false);

    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to add unit. Check your inputs.");
    } else {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Unit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Building className="w-5 h-5 text-blue-600" />
            Add New Inventory
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-2">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Number</Label>
              <Input name="unitNumber" placeholder="e.g. A-101" required />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <select 
                name="projectId" 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm" 
                required
              >
                <option value="">-- Select Project --</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cash Price (KSh)</Label>
              <Input name="cashPrice" type="number" placeholder="15000000" min="1" required />
            </div>
            <div className="space-y-2">
              <Label>Mortgage Price (KSh)</Label>
              <Input name="mortgagePrice" type="number" placeholder="16500000" min="1" required />
            </div>
          </div>

          <div className="space-y-2 p-3 bg-slate-50 border border-slate-100 rounded-md">
            <Label className="text-slate-700">Initial Market Status</Label>
            <select name="status" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" required>
              <option value="AVAILABLE">Available (Open for Sale)</option>
              <option value="BLOCKED">Blocked (Hold for VIP/Management)</option>
            </select>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-2 font-medium">
          
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
            {isPending ? "Adding Unit..." : "Save Unit to Inventory"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}