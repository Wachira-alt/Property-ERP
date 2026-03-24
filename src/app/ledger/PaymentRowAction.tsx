"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Receipt, Clock } from "lucide-react";
import { markAsPaid } from "./LedgerActions";

export function PaymentRowAction({ entry }: { entry: any }) {
  const [loading, setLoading] = useState(false);

  if (entry.status === "PAID") {
    return (
      <div className="flex items-center justify-end gap-3">
        <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Confirmed
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
          <Receipt className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await markAsPaid(entry.id);
        setLoading(false);
      }}
      className="bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-lg transition-all"
    >
      {loading ? "Processing..." : "Mark as Paid"}
    </Button>
  );
}