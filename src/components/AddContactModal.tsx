"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { createContact } from "@/app/actions/contacts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Building2, LayoutGrid, Hash } from "lucide-react";

export function AddContactModal({ agents, projects }: { agents: any[], projects: any[] }) {
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");

  // 1. Filter Categories (Unit Types) based on Project
  const availableTypes = useMemo(() => {
    const project = projects.find(p => p.id === selectedProjectId);
    return project?.unitTypes || [];
  }, [selectedProjectId, projects]);

  // 2. Filter Units based on Category
  const availableUnits = useMemo(() => {
    const type = availableTypes.find(t => t.id === selectedTypeId);
    return type?.units || [];
  }, [selectedTypeId, availableTypes]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 text-white font-bold hover:bg-blue-700 transition-all gap-2">
          <UserPlus className="w-4 h-4" /> New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">Register Floating Lead</DialogTitle>
        </DialogHeader>

        <form action={async (formData) => {
          await createContact(formData);
          setOpen(false);
        }} className="space-y-6 pt-4">
          
          {/* PERSONAL INFO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400">First Name</Label>
              <Input name="firstName" required className="rounded-xl h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400">Last Name</Label>
              <Input name="lastName" required className="rounded-xl h-11" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400">Phone Number</Label>
            <Input name="phone" placeholder="+254..." required className="rounded-xl h-11" />
          </div>

          <hr className="border-slate-100" />

          {/* PROJECT INTEREST HIERARCHY */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Select Project
              </Label>
              <Select name="projectId" onValueChange={(val) => {
                setSelectedProjectId(val);
                setSelectedTypeId(""); // Reset category
              }}>
                <SelectTrigger className="bg-white h-11 rounded-xl">
                  <SelectValue placeholder="Which estate?" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <LayoutGrid className="w-3 h-3" /> Category
                </Label>
                <Select 
                  name="unitTypeId" 
                  disabled={!selectedProjectId}
                  onValueChange={setSelectedTypeId}
                >
                  <SelectTrigger className="bg-white h-11 rounded-xl">
                    <SelectValue placeholder="Studio, 2BR..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Target Unit
                </Label>
                <Select name="interestedUnitId" disabled={!selectedTypeId}>
                  <SelectTrigger className="bg-white h-11 rounded-xl">
                    <SelectValue placeholder="Select ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map(u => <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SOURCING AGENT */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400">Sourcing Agent</Label>
            <Select name="sourcingAgentId">
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Who brought this lead?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organic">Organic / Walk-in</SelectItem>
                {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.role})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-12 rounded-xl">
            Register Lead & Assign Unit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}