import prisma from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, CheckCircle2 } from "lucide-react";
import { PaymentRowAction } from "./PaymentRowAction";

export default async function CentralLedgerPage() {
  const closedDeals = await prisma.opportunity.findMany({
    where: { 
      status: "CLOSED" // Matches your OpportunityStatus enum
    },
    include: {
      contact: true,
      unit: { 
        include: { 
          unitType: { 
            include: { project: true } 
          } 
        } 
      },
      ledgerEntries: { 
        orderBy: { dueDate: "asc" } 
      }
    },
    orderBy: { 
      createdAt: "desc" // Changed from updatedAt to createdAt to match schema
    }
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Central Ledger</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mt-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            Stage 5: Post-Closing Revenue Collection
          </p>
        </div>
        <div className="bg-slate-900 px-8 py-4 rounded-[2rem] text-white shadow-2xl border border-slate-800">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 text-right">Terminal Status</p>
          <p className="text-lg font-black italic tracking-tight text-blue-400 uppercase">Accounting Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {closedDeals.map((deal) => (
          <div key={deal.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* DEAL HEADER CARD */}
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-slate-900/20 italic">
                  {deal.unit?.unitNumber}
                </div>
                <div>
                  <h3 className="font-black uppercase text-lg text-slate-900 tracking-tight">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                    {deal.unit?.unitType.project.name} <span className="text-slate-300 mx-2">/</span> {deal.unit?.unitType.name}
                  </p>
                </div>
              </div>
              <div className="text-left md:text-right bg-white px-6 py-3 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Contract Value</p>
                <p className="font-black text-xl text-slate-900 italic">
                  KES {Number(deal.agreedPrice).toLocaleString()}
                </p>
              </div>
            </div>

            {/* LEDGER ENTRIES TABLE */}
            <div className="px-4">
              <Table>
                <TableHeader>
                  <TableRow className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 border-none hover:bg-transparent">
                    <TableHead className="pl-8 h-12">Installment Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount (KES)</TableHead>
                    <TableHead className="text-right pr-8">Status / Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deal.ledgerEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                      <TableCell className="pl-8 font-bold text-slate-800 text-xs py-5">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                        {new Date(entry.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="font-black text-slate-900 text-sm italic">
                        {Number(entry.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <PaymentRowAction entry={entry} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="p-4 bg-slate-50/30 text-center border-t border-slate-50">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">End of Ledger for {deal.unit?.unitNumber}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}