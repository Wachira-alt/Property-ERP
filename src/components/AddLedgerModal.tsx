"use client";

import { useState } from "react";
import { addLedgerEntry } from "@/app/actions";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Deal = {
  id: string;
  clientName: string;
  unit: string;
};

export function AddLedgerModal({ deals }: { deals: Deal[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    const result = await addLedgerEntry(formData);
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
          <Receipt className="w-4 h-4" />
          Log Transaction
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Financial Entry</DialogTitle>
          <DialogDescription>
            Log an invoice or a payment against an active deal.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="opportunityId">Select Deal</Label>
            <select name="opportunityId" id="opportunityId" required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <option value="">-- Choose a Deal --</option>
              {deals.map(d => (
                <option key={d.id} value={d.id}>{d.clientName} - {d.unit}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Entry Type</Label>
              <select name="type" id="type" required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <option value="INVOICE">Invoice (Billed)</option>
                <option value="PAYMENT">Payment (Received)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select name="status" id="status" required className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" name="dueDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference / Check #</Label>
              <Input id="reference" name="reference" placeholder="e.g. CHK-1042" />
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isPending}>
            {isPending ? "Logging..." : "Save Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}