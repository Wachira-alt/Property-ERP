"use client";

import { useState } from "react";
import { addOpportunity } from "@/app/actions";
import { GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define the types for the props we will pass in
type Contact = { id: string; firstName: string; lastName: string };
type Property = { id: string; unitNumber: string; projectName: string };

export function AddOpportunityModal({ 
  contacts, 
  properties 
}: { 
  contacts: Contact[]; 
  properties: Property[] 
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    const result = await addOpportunity(formData);
    setIsPending(false);

    if (result?.success) {
      setOpen(false);
    } else {
      alert("Error saving: " + JSON.stringify(result?.error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <GitMerge className="w-4 h-4" />
          New Deal
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Deal</DialogTitle>
          <DialogDescription>
            Link a client to an available property and set their pipeline status.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="contactId">Select Client</Label>
            {/* Using native select here to make standard FormData extraction easier */}
            <select name="contactId" id="contactId" required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <option value="">-- Choose a Contact --</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyId">Select Unit (Available Only)</Label>
            <select name="propertyId" id="propertyId" required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <option value="">-- Choose a Unit --</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.projectName} - {p.unitNumber}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Pipeline Stage (Traffic Light)</Label>
            <select name="status" id="status" required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <option value="GREEN">Green (Closing / Active)</option>
              <option value="AMBER_1">Amber 1 (Warm / Negotiating)</option>
              <option value="AMBER_2">Amber 2 (Cold / Nurture)</option>
              <option value="RED">Red (Lost / Disqualified)</option>
            </select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isPending}>
            {isPending ? "Creating Deal..." : "Create Deal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}