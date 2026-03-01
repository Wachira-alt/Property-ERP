"use client";

import { useState } from "react";
import { addOpportunity } from "@/app/actions";
import { Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddOpportunityModal({ contacts, properties }: { contacts: any[], properties: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    // Silently inject the default status so the backend validation passes flawlessly
    formData.set("status", "RESERVED");

    const result = await addOpportunity(formData);
    setIsPending(false);

    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to create deal. Please check your inputs.");
    } else {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Create Pipeline Deal
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-2">
            <Label>Select Client</Label>
            <select name="contactId" className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm" required>
              <option value="">-- Choose Client --</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Select Unit</Label>
            <select name="propertyId" className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm" required>
              <option value="">-- Choose Available Unit --</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  Unit {p.unitNumber} - {p.project?.name || 'Unassigned'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Financing Method</Label>
            <select name="financingMethod" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" required>
              <option value="CASH">Cash / Standard Installments</option>
              <option value="MORTGAGE">Bank Mortgage</option>
            </select>
          </div>

          {/* Educational UI for the user */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-xs text-blue-800 font-medium text-center">
              New deals automatically start as <span className="font-bold">RESERVED</span>. The system will upgrade it to Active once a deposit is logged.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
            {isPending ? "Creating..." : "Save Deal to Pipeline"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}