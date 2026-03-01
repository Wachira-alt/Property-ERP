"use client";

import { useState } from "react";
import { generatePaymentPlan } from "@/app/actions";
import { CalendarDays, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function GeneratePlanModal({ deals }: { deals: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We need to fetch the selected deal dynamically so we can auto-fill the Total Amount
  const [selectedDealId, setSelectedDealId] = useState("");

  const selectedDeal = deals.find(d => d.id === selectedDealId);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await generatePaymentPlan(formData);
    setIsPending(false);

    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to generate plan. Check your inputs.");
    } else {
      setOpen(false);
      setSelectedDealId(""); // Reset
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
          <CalendarDays className="w-4 h-4 mr-2" /> Generate Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Generate Payment Schedule
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-2">
            <Label>Select Client & Unit</Label>
            <select 
              name="opportunityId" 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm" 
              required
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
            >
              <option value="">-- Choose Active Deal --</option>
              {deals.map(deal => (
                <option key={deal.id} value={deal.id}>
                  {deal.clientName} — Unit {deal.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-xs text-blue-800 font-medium">
              Deal Type: {selectedDeal ? selectedDeal.financingMethod : "N/A"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Property Price</Label>
              <Input 
                name="totalAmount" 
                type="number" 
                readOnly 
                className="bg-slate-100 text-slate-500 font-bold"
                value={selectedDeal ? selectedDeal.price : ""} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Required Deposit</Label>
              <Input 
                name="deposit" 
                type="number" 
                placeholder="e.g. 1000000" 
                min="0" 
                max={selectedDeal ? selectedDeal.price : undefined}
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (Months)</Label>
              {/* UNRESTRICTED INPUT: Can handle 1 month or 240 months */}
              <Input 
                name="months" 
                type="number" 
                placeholder="e.g. 60" 
                min="0" 
                required 
                disabled={selectedDeal?.financingMethod === "MORTGAGE"} // Mortgages don't use monthly installments here
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input name="startDate" type="date" required />
            </div>
          </div>

          {selectedDeal?.financingMethod === "MORTGAGE" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 uppercase tracking-wider font-bold">
                Mortgage deals do not require months. The system will schedule a single bulk disbursement 90 days from the start date.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
            {isPending ? "Generating Plan..." : "Generate Invoices"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}