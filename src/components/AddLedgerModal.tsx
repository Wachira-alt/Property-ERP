"use client";

import { useState } from "react";
import { addLedgerEntry } from "@/app/actions";
import { Plus, Receipt, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AddLedgerModal({ deals }: { deals: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default to PAYMENT. "INVOICE" is completely removed from human control!
  const [entryType, setEntryType] = useState("PAYMENT");

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    
    // Auto-categorize payments so humans don't have to guess
    if (entryType === "PAYMENT") {
      formData.set("reference", "Auto-Categorized Payment");
    }
    
    const result = await addLedgerEntry(formData);
    
    setIsPending(false);

    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Failed to save entry. Check inputs.");
    } else {
      setOpen(false);
      setEntryType("PAYMENT"); 
    }
  }

  const isRefund = entryType === "REFUND";
  const isPayment = entryType === "PAYMENT";
  const themeColor = isRefund ? "text-red-600" : "text-emerald-600";
  const buttonColor = isRefund ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Log Cash Movement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${themeColor}`}>
            <Receipt className="w-5 h-5" /> 
            {isRefund ? "Process Client Refund" : "Log Incoming Payment"}
          </DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-2">
            <Label>Client & Unit</Label>
            <select name="opportunityId" className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-slate-50" required>
              <option value="">-- Select Active Deal --</option>
              {deals.map(deal => (
                <option key={deal.id} value={deal.id}>
                  {deal.clientName} — Unit {deal.unit} (KSh {deal.price.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cash Direction</Label>
              <select 
                name="type" 
                className={`flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-bold ${isRefund ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                required
              >
                {/* THE INVOICE OPTION IS GONE. HUMANS ONLY LOG CASH NOW. */}
                <option value="PAYMENT">Money IN (Payment)</option>
                <option value="REFUND">Money OUT (Refund)</option>
              </select>
            </div>

            {isRefund ? (
              <div className="space-y-2">
                <Label>Refund Reason</Label>
                <select name="reference" className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" required>
                  <option value="">-- Select Reason --</option>
                  <option value="Deal Cancellation">Deal Cancellation</option>
                  <option value="Overpayment Reversal">Overpayment Reversal</option>
                  <option value="Goodwill / Dispute">Goodwill / Dispute</option>
                </select>
              </div>
            ) : (
              <div className="flex flex-col justify-center px-3 py-2 mt-[22px] bg-indigo-50 border border-indigo-100 rounded-md">
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Auto-Match</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (KSh)</Label>
              <Input name="amount" type="number" placeholder="50000" min="1" required />
            </div>

            <div className="space-y-2">
              <Label>Bank Status</Label>
              <select name="status" className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" required>
                {isRefund && <option value="PENDING">Pending (Awaiting Auth)</option>}
                <option value="PAID">Paid (Cleared in Bank)</option>
              </select>
            </div>
          </div>

          {/* Due date only matters for scheduled refunds now */}
          {isRefund && (
            <div className="space-y-2 p-3 rounded-lg border bg-red-50 border-red-100">
              <Label className="text-red-800">Expected Processing Date</Label>
              <Input name="dueDate" type="date" className="bg-white" required />
            </div>
          )}

          {isRefund && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                <strong>Zero-Balance Protocol Active:</strong> If this refund drops the client's net paid balance to KSh 0, the system will automatically kill the deal.
              </p>
            </div>
          )}
          
          {isPayment && (
            <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-medium">
              The system will automatically categorize this payment into the correct bucket (Booking Fee, Deposit, or Installment) based on the client's generated payment plan.
            </p>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" className={`w-full text-white ${buttonColor}`} disabled={isPending}>
            {isPending ? "Processing..." : isRefund ? "Authorize Refund" : "Log Incoming Cash"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}