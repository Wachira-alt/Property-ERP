import prisma from "@/lib/prisma";
import { AddLedgerModal } from "@/components/AddLedgerModal";
import { GeneratePlanModal } from "@/components/GeneratePlanModal";
import { DownloadStatementBtn } from "@/components/DownloadStatementBtn";
import { ViewLedgerModal } from "@/components/ViewLedgerModal"; // <--- 1. NEW IMPORT
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle2, AlertCircle } from "lucide-react";

export default async function LedgerPage() {
  const dealsWithLedgers = await prisma.opportunity.findMany({
    where: { 
      ledger: { some: {} } 
    },
    include: {
      contact: true,
      property: { include: { project: true } },
      ledger: { orderBy: { dueDate: "asc" } } 
    },
    orderBy: { createdAt: "desc" }
  });

  const activeDealsForModals = await prisma.opportunity.findMany({
    where: { status: { notIn: ["CANCELLED", "COMPLETED"] } }, 
    include: { contact: true, property: true }
  });

  const cleanDeals = activeDealsForModals.map(deal => ({
    id: deal.id,
    clientName: `${deal.contact.firstName} ${deal.contact.lastName}`,
    unit: deal.property.unitNumber,
    financingMethod: deal.financingMethod,
    price: deal.financingMethod === "MORTGAGE" ? Number(deal.property.mortgagePrice) : Number(deal.property.cashPrice)
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Client Accounts</h1>
          <p className="text-slate-500 mt-1">Manage individual client balances and statements.</p>
        </div>
        <div className="flex gap-2">
          <GeneratePlanModal deals={cleanDeals} />
          <AddLedgerModal deals={cleanDeals} />
        </div>
      </div>

      {dealsWithLedgers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <p className="text-slate-500">No active financial accounts yet. Generate a plan to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dealsWithLedgers.map((deal) => {
            
            const targetPrice = deal.financingMethod === "MORTGAGE" ? Number(deal.property.mortgagePrice) : Number(deal.property.cashPrice);
            const totalPayments = deal.ledger.filter(e => e.type === "PAYMENT" && e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
            const totalRefunds = deal.ledger.filter(e => e.type === "REFUND" && e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
            const netPaid = totalPayments - totalRefunds;
            const balance = targetPrice - netPaid;

            const hasOverdue = deal.ledger.some(e => e.type === "INVOICE" && e.status === "PENDING" && e.dueDate && new Date(e.dueDate) < new Date());
            const isCompleted = deal.status === "COMPLETED";

            const pdfClientData = {
              name: `${deal.contact.firstName} ${deal.contact.lastName}`,
              unit: deal.property.unitNumber,
              projectName: deal.property.project?.name || "Unassigned"
            };

            return (
              <div key={deal.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{deal.contact.firstName} {deal.contact.lastName}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Unit {deal.property.unitNumber} • {deal.property.project?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Purchase Price</span>
                    <span className="font-medium text-slate-900">KSh {targetPrice.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Net Cash Paid</span>
                    <span className="font-bold text-emerald-600">KSh {netPaid.toLocaleString()}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-slate-700 font-medium">Remaining Balance</span>
                    {isCompleted ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Fully Paid
                      </Badge>
                    ) : (
                      <span className={`font-bold text-lg ${hasOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                        KSh {balance.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {hasOverdue && !isCompleted && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-md font-medium">
                      <AlertCircle className="w-4 h-4" /> This account has overdue payments.
                    </div>
                  )}
                </div>

                {/* 2. NEW FOOTER ACTION BUTTONS */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
  <ViewLedgerModal client={pdfClientData} entries={deal.ledger} />
  <DownloadStatementBtn client={pdfClientData} items={deal.ledger} /> 
</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}