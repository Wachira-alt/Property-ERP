"use client";

import { useState } from "react";
import { initializeReservation } from "@/app/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogDescription 
} from "@/components/ui/dialog";
import { Zap, ShieldAlert, BadgeCent, CreditCard } from "lucide-react";

export function InitializeReservationForm({ contactId, unitId }: { contactId: string, unitId: string | null }) {
  const [loading, setLoading] = useState(false);

  if (!unitId) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600" />
        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">
          No Unit Assigned. Update profile to select a unit before initializing.
        </p>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest px-8 py-6 rounded-2xl shadow-lg shadow-emerald-900/20 gap-3">
          <Zap className="w-5 h-5 fill-white" /> Initialize Stage 2: Amber Lock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <BadgeCent className="w-6 h-6 text-emerald-600" /> Confirm Reservation
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Define the agreed sale price and payment strategy to generate the Offer Letter.
          </DialogDescription>
        </DialogHeader>

        <form action={async (formData) => {
          setLoading(true);
          try {
            await initializeReservation(formData);
          } finally {
            setLoading(false);
          }
        }} className="space-y-6 pt-4">
          <input type="hidden" name="contactId" value={contactId} />
          <input type="hidden" name="unitId" value={unitId} />

          {/* AGREED PRICE */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Agreed Sale Price (KES)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">KES</span>
              <Input 
                name="agreedPrice" 
                type="number" 
                placeholder="e.g. 3,500,000" 
                required 
                className="pl-14 h-14 rounded-2xl border-slate-200 focus:ring-emerald-500 text-lg font-bold"
              />
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Payment Method
            </Label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select 
                name="paymentMethod" 
                required 
                className="w-full pl-12 h-14 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
              >
                <option value="CASH">Cash Purchase</option>
                <option value="MORTGAGE">Bank Mortgage</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
              Stage 2 will lock the unit for 7 days. You will build the manual installment ledger in the next screen.
            </p>
          </div>

          <Button 
            disabled={loading}
            type="submit" 
            className="w-full h-14 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all"
          >
            {loading ? "Processing..." : "Confirm & Lock Unit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}