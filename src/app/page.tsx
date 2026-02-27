import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, Activity, AlertCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  const today = new Date();

  // 1. Fetch all dashboard data in parallel
  const [
    activeDealsData,
    cashCollectedData,
    inventoryData,
    recentDeals,
    pendingInvoices
  ] = await Promise.all([
    // Get all active deals to calculate total pipeline value
    prisma.opportunity.findMany({
      where: { status: { not: "RED" } },
      include: { property: true }
    }),
    
    // Sum up all cash actually in the bank
    prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { type: "PAYMENT", status: "PAID" }
    }),

    // Get stats on available inventory to sell
    prisma.property.findMany({
      where: { status: "AVAILABLE" }
    }),

    // Get the 5 most recent deals
    prisma.opportunity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { contact: true, property: true }
    }),

    // Get upcoming or overdue pending invoices
    prisma.ledgerEntry.findMany({
      take: 5,
      where: { type: "INVOICE", status: "PENDING" },
      orderBy: { dueDate: "asc" }, // Show oldest/overdue first
      include: { opportunity: { include: { contact: true, property: true } } }
    })
  ]);

  // 2. SMART MATH: Calculate true business metrics
  const totalPipelineValue = activeDealsData.reduce((sum, deal) => sum + Number(deal.property.price), 0);
  const cashCollected = Number(cashCollectedData._sum.amount || 0);
  const outstandingBalance = totalPipelineValue - cashCollected;
  
  const availableInventoryCount = inventoryData.length;
  const availableInventoryValue = inventoryData.reduce((sum, prop) => sum + Number(prop.price), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Command Center</h1>
        <p className="text-slate-500 mt-1">Real-time financial and operational health.</p>
      </div>

      {/* --- Top Metrics Row --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pipeline Value</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${totalPipelineValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{activeDealsData.length} active deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Cash Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              ${cashCollected.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
              <div 
                className="bg-emerald-500 h-1 rounded-full" 
                style={{ width: `${totalPipelineValue > 0 ? (cashCollected / totalPipelineValue) * 100 : 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Outstanding Balance</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              ${outstandingBalance > 0 ? outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 0 }) : 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pending from active deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Available Inventory</CardTitle>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${availableInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{availableInventoryCount} units ready to sell</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Action Feeds Row --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        
        {/* Recent Deals Feed */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Deals</CardTitle>
            </div>
            <Link href="/opportunities" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              View Pipeline <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentDeals.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No deals created yet.</p>
              ) : (
                recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {deal.contact.firstName} {deal.contact.lastName}
                      </p>
                      <p className="text-xs text-slate-500">Unit {deal.property.unitNumber} • {deal.property.projectName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        ${Number(deal.property.price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </div>
                      <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wider bg-slate-50">
                        {deal.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Required: Pending Invoices */}
        <Card className="border-slate-200 shadow-sm border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Action Required</CardTitle>
              <p className="text-sm text-slate-500">Upcoming & overdue invoices</p>
            </div>
            <Link href="/ledger" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium">
              Go to Ledger <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pendingInvoices.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">All caught up! No pending invoices.</p>
              ) : (
                pendingInvoices.map((invoice) => {
                  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < today;
                  
                  return (
                    <div key={invoice.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {invoice.opportunity.contact.firstName} {invoice.opportunity.contact.lastName}
                        </p>
                        <p className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-amber-600"}`}>
                          {isOverdue ? "OVERDUE • " : "DUE • "} 
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "No date"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">
                          ${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{invoice.reference || "Invoice"}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}