"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert, PartyPopper, Lock } from "lucide-react";
import { finalizeSale } from "@/app/actions/contacts";
import { useState } from "react";

export function ClosingGate({ contactId, unitId, opportunityId, isDocsReady }: any) {
  const [loading, setLoading] = useState(false);

  if (!isDocsReady) {
    return (
      <div className="p-6 bg-slate-100 border border-slate-200 rounded-[2rem] flex flex-col items-center text-center gap-3">
        <Lock className="w-6 h-6 text-slate-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Stage 4 Locked: Missing Mandatory Documents (ID, KRA, Offer, or Receipt)
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-[2rem] flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
        <PartyPopper className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-black uppercase text-blue-900 tracking-tight">Ready to Close Sale</h4>
        <p className="text-[10px] font-medium text-blue-700">All KYC and financial proofs have been vaulted.</p>
      </div>
      <Button 
        onClick={async () => {
          setLoading(true);
          await finalizeSale(opportunityId, unitId, contactId);
          setLoading(false);
        }}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-6 rounded-2xl"
      >
        {loading ? "Closing..." : "Finalize Sale (Stage 4)"}
      </Button>
    </div>
  );
}