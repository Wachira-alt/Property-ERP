"use client";

import { useState } from "react";
import { generatePaymentPlan } from "@/app/actions";
import { CalendarClock } from "lucide-react";
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

type Deal = { id: string; clientName: string; unit: string; price: number };

export function GeneratePlanModal({ deals }: { deals: Deal[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    const result = await generatePaymentPlan(formData);
    setIsPending(false);
    if (result?.success) setOpen(false);
    else alert("Error: " + JSON.stringify(result?.error));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
          <CalendarClock className="w-4 h-4" />
          Generate Plan
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Payment Plan Generator</DialogTitle>
          <DialogDescription>Automatically create monthly invoices for a deal.</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Select Deal</Label>
            <select 
              name="opportunityId" 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                const deal = deals.find(d => d.id === e.target.value);
                setSelectedPrice(deal ? deal.price : 0);
              }}
              required
            >
              <option value="">-- Choose Deal --</option>
              {deals.map(d => (
                <option key={d.id} value={d.id}>{d.clientName} - {d.unit}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Price</Label>
              <Input name="totalAmount" type="number" defaultValue={selectedPrice} key={selectedPrice} required />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input name="startDate" type="date" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Down Payment ($)</Label>
              <Input name="deposit" type="number" placeholder="0" required />
            </div>
            <div className="space-y-2">
              <Label>Duration (Months)</Label>
              <Input name="months" type="number" defaultValue={12} required />
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isPending}>
            {isPending ? "Generating..." : "Create Schedule"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}