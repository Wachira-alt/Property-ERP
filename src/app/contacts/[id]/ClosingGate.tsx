// src/app/contacts/[id]/ClosingGate.tsx
"use client";

import { useState } from "react";
import { Lock, Unlock, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { finalizeSale } from "@/app/actions/documents";
import { toast } from "sonner";

export function ClosingGate({ opportunity }: { opportunity: any }) {
  const [isPending, setIsPending] = useState(false);

  // Optional chaining prevents 'undefined' crashes during initial load
  const canFinalize = 
    !!opportunity?.contact?.idDocumentUrl && 
    !!opportunity?.contact?.kraDocumentUrl && 
    !!opportunity?.contact?.signedOfferUrl && 
    !!opportunity?.contact?.bookingFeeUrl;

  if (opportunity?.status === "CLOSED") {
    return (
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white border border-blue-500/30 flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Unit Hard-Locked</h2>
        <ShieldCheck className="w-10 h-10 text-blue-400" />
      </div>
    );
  }

  return (
    <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${canFinalize ? 'border-emerald-500 bg-white' : 'border-slate-100 bg-slate-50'}`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {canFinalize ? <Unlock className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5 text-slate-300" />}
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Finalize Transaction</h3>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase">
            {canFinalize ? "Verification complete. Lock as SOLD." : "Complete all 4 document slots to unlock."}
          </p>
        </div>
        <Button 
          onClick={async () => {
            setIsPending(true);
            try {
              await finalizeSale(opportunity.id);
              toast.success("Unit Status: SOLD");
            } catch (e: any) {
              toast.error(e.message);
            } finally { setIsPending(false); }
          }}
          disabled={!canFinalize || isPending}
          className={`h-20 px-12 rounded-[1.5rem] font-black uppercase ${canFinalize ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}
        >
          {isPending ? "Locking..." : "Finalize Sale"}
        </Button>
      </div>
    </div>
  );
}