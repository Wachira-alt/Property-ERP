"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, AlertCircle, CheckCircle2, BadgeCent } from "lucide-react";
import { createLedgerEntries } from "@/app/ledger/LedgerActions";

export function ManualLedgerBuilder({ opportunityId, contactId, entries, agreedPrice }: any) {
  const numericPrice = Number(agreedPrice);
  const [rows, setRows] = useState(entries.length > 0 ? entries : [
    { description: "Booking Fee / Deposit", amount: "", dueDate: "" }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const totalModeled = rows.reduce((acc: number, row: any) => acc + (parseFloat(row.amount) || 0), 0);
  
  // NEW LOGIC: Must be equal or greater than agreed price
  const isValidTotal = totalModeled >= (numericPrice - 0.01);

  const addRow = () => setRows([...rows, { description: "", amount: "", dueDate: "" }]);
  const removeRow = (index: number) => setRows(rows.filter((_: any, i: number) => i !== index));

  const updateRow = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-8 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <BadgeCent className="w-5 h-5 text-blue-600" /> Payment Schedule Modeling
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Agreed Sale Price: <span className="text-slate-900">KES {numericPrice.toLocaleString()}</span>
          </p>
        </div>

        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${isValidTotal ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          {isValidTotal ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {totalModeled > numericPrice 
              ? `Surplus: KES ${(totalModeled - numericPrice).toLocaleString()}` 
              : `Modeled: KES ${totalModeled.toLocaleString()}`}
          </span>
        </div>
      </div>

      <div className="p-8 space-y-4">
        {rows.map((row: any, index: number) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5 space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Description</Label>
              <Input 
                value={row.description} 
                onChange={(e) => updateRow(index, "description", e.target.value)}
                className="rounded-xl border-slate-200 h-11 text-xs font-bold"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Amount (KES)</Label>
              <Input 
                type="number"
                value={row.amount} 
                onChange={(e) => updateRow(index, "amount", e.target.value)}
                className="rounded-xl border-slate-200 h-11 text-xs font-bold"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Due Date</Label>
              <Input 
                type="date"
                value={row.dueDate ? new Date(row.dueDate).toISOString().split('T')[0] : ""} 
                onChange={(e) => updateRow(index, "dueDate", e.target.value)}
                className="rounded-xl border-slate-200 h-11 text-xs font-bold"
              />
            </div>
            <div className="md:col-span-1 pb-1">
              <Button variant="ghost" size="icon" onClick={() => removeRow(index)} className="text-slate-300 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="pt-6 flex justify-between items-center border-t border-slate-100 mt-8">
          <Button variant="outline" onClick={addRow} className="rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest gap-2">
            <Plus className="w-4 h-4" /> Add Row
          </Button>

          <Button 
            disabled={!isValidTotal || isSaving}
            onClick={async () => {
              setIsSaving(true);
              await createLedgerEntries(opportunityId, contactId, rows);
              setIsSaving(false);
            }}
            className="bg-slate-900 text-white rounded-xl px-8 h-12 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-blue-600 disabled:opacity-30"
          >
            <Save className="w-4 h-4" /> 
            {isSaving ? "Saving..." : "Lock Ledger & Generate Offer"}
          </Button>
        </div>
      </div>
    </div>
  );
}