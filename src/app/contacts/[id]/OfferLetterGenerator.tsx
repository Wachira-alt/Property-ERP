"use client";

import { Printer, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfferLetterGenerator({ contact, opportunity, ledgerEntries }: any) {
  const hasLedger = ledgerEntries.length > 0;
  // Rule: ID and KRA must be vaulted before generating offer
  const amberComplete = !!(contact.idDocumentUrl && contact.kraDocumentUrl);

  return (
    <div className={`rounded-[2.5rem] p-8 border transition-all ${hasLedger ? "bg-slate-900 border-slate-800 shadow-2xl" : "bg-slate-50 border-slate-200 opacity-60"}`}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className={`w-4 h-4 ${hasLedger ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Legal Document Engine</span>
          </div>
          <h3 className="text-2xl font-black text-white uppercase italic">Letter of Offer</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button 
          onClick={() => window.print()}
          disabled={!hasLedger || !amberComplete}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg"
        >
          <Printer className="w-5 h-5 mr-3" /> 
          {!amberComplete ? "Upload ID/KRA to unlock" : "Print Physical Copy"}
        </Button>
      </div>

      {/* --- HIDDEN PRINT TEMPLATE (Fixed with .print-only) --- */}
      <div className="hidden print:block print-only p-12 text-black bg-white min-h-screen">
        <div className="flex justify-between border-b-2 border-black pb-8 mb-10">
          <h1 className="text-3xl font-bold uppercase">Letter of Offer</h1>
          <div className="text-right text-sm">
            <p className="font-bold">Bustani Property ERP</p>
            <p>{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm">
          <p>Dear <span className="font-bold">{contact.firstName} {contact.lastName}</span>,</p>
          <p>We are pleased to offer you Unit <span className="font-bold">{opportunity.unit?.unitNumber}</span> at <span className="font-bold">KES {Number(opportunity.agreedPrice).toLocaleString()}</span>.</p>
          
          <h2 className="text-lg font-bold uppercase mt-10">Schedule of Payments ({opportunity.paymentMethod})</h2>
          <table className="w-full border-collapse border border-black mt-4">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <td className="border border-black p-2">Description</td>
                <td className="border border-black p-2 text-right">Amount (KES)</td>
                <td className="border border-black p-2">Due Date</td>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((entry: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-black p-2 uppercase">{entry.description}</td>
                  <td className="border border-black p-2 text-right font-bold">{Number(entry.amount).toLocaleString()}</td>
                  <td className="border border-black p-2">{new Date(entry.dueDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* ... Signature fields ... */}
        </div>
      </div>
    </div>
  );
}