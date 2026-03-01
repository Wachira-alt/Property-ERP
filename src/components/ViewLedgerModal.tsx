"use client";

import { useState } from "react";
import { Eye, Receipt, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DownloadReceiptBtn } from "./DownloadReceiptBtn";

export function ViewLedgerModal({ client, entries }: { client: any; entries: any[] }) {
  const [open, setOpen] = useState(false);

  // 1. Math & Progress
  const totalBilled = entries.filter(e => e.type === "INVOICE").reduce((s, e) => s + Number(e.amount), 0);
  const totalPayments = entries.filter(e => e.type === "PAYMENT" && e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
  const totalRefunds = entries.filter(e => e.type === "REFUND" && e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
  const netPaid = totalPayments - totalRefunds;
  const currentBalance = totalBilled - netPaid;
  
  const progressPercent = totalBilled > 0 ? Math.min(Math.round((netPaid / totalBilled) * 100), 100) : 0;
  const isFullyPaid = progressPercent === 100 && totalBilled > 0;

  // 2. Separate Data into Two Lists
  const invoices = entries.filter(e => e.type === "INVOICE").sort((a, b) => {
    return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
  });

  const transactions = entries.filter(e => e.type !== "INVOICE").sort((a, b) => {
    return new Date(a.paidDate || a.createdAt).getTime() - new Date(b.paidDate || b.createdAt).getTime();
  });

  // 3. Waterfall Engine for Invoice Statuses
  let remainingCash = netPaid;
  const invoiceStatuses = invoices.map(inv => {
    const amount = Number(inv.amount);
    const filled = Math.min(Math.max(remainingCash, 0), amount);
    remainingCash -= amount;

    if (filled >= amount) return { status: "CLEARED", filled, amount };
    if (filled > 0) return { status: "PARTIAL", filled, amount };
    return { status: "PENDING", filled, amount };
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all hover:shadow-md">
          <Eye className="w-4 h-4 mr-2" /> View Client Statement
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto bg-slate-50 p-0 border-0">
        
        {/* PREMIUM HEADER SECTION */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Receipt className="w-48 h-48" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-1">{client.name}</h2>
            <p className="text-blue-300 font-medium tracking-wide">Unit {client.unit} • {client.projectName}</p>
            
            <div className="mt-8 grid grid-cols-3 gap-6">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Value</p>
                <p className="text-2xl font-bold">KSh {totalBilled.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-400">KSh {netPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Balance</p>
                <p className="text-2xl font-bold text-white">KSh {currentBalance.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-emerald-400 uppercase tracking-wider">Payment Progress</span>
                <span className="text-white">{progressPercent}%</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isFullyPaid ? 'bg-emerald-400' : 'bg-blue-500'}`} 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT PANE: PAYMENT SCHEDULE (INVOICES) */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Payment Schedule
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No schedule generated.</div>
              ) : (
                invoices.map((inv, index) => {
                  const state = invoiceStatuses[index];
                  return (
                    <div key={inv.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-900">{inv.reference}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        {/* YOUR EXACT LOGIC EXECUTED HERE */}
                        {state.status === "CLEARED" && (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            <CheckCircle2 className="w-3 h-3" /> CLEARED
                          </span>
                        )}
                        {state.status === "PARTIAL" && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            {state.filled.toLocaleString()} / {state.amount.toLocaleString()} PAID
                          </span>
                        )}
                        {state.status === "PENDING" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <AlertCircle className="w-3 h-3" /> PENDING
                          </span>
                        )}
                        <p className="text-sm font-bold text-slate-900 mt-1">
                          KSh {Number(inv.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: RECEIPTS & HISTORY */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" /> Receipts & History
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No payments recorded.</div>
              ) : (
                transactions.map((entry) => {
                  const isPayment = entry.type === "PAYMENT";
                  const isRefund = entry.type === "REFUND";
                  const displayDate = entry.paidDate || entry.createdAt;

                  return (
                    <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPayment ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {isPayment ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{entry.reference || "Payment"}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {new Date(displayDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold text-sm ${isPayment ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPayment ? "+" : "-"} {Number(entry.amount).toLocaleString()}
                        </span>
                        <DownloadReceiptBtn client={client} entry={entry} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}