import { prisma } from "@/lib/prisma";
import { Users, Building2, TrendingUp, Wallet, ArrowDownRight, AlertTriangle, Activity, Banknote, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DashboardPage() {
  const now = new Date();

  const [
    totalContacts, 
    availableProperties, 
    allActiveDeals, 
    paidLedgerEntries, 
    pendingInvoices,
    recentPayments
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.property.count({ where: { status: "AVAILABLE" } }),
    prisma.opportunity.findMany({ 
      where: { status: { notIn: ["CANCELLED"] } },
      include: { property: true, contact: true }
    }),
    prisma.ledgerEntry.findMany({ where: { status: "PAID" } }),
    prisma.ledgerEntry.findMany({ 
      where: { type: "INVOICE", status: "PENDING" },
      include: { opportunity: { include: { contact: true, property: true } } }
    }),
    prisma.ledgerEntry.findMany({
      where: { type: "PAYMENT", status: "PAID" },
      take: 5,
      orderBy: { paidDate: "desc" },
      include: { opportunity: { include: { contact: true, property: true } } }
    })
  ]);

  // 1. CASH IN BANK (Net Revenue)
  const totalPayments = paidLedgerEntries.filter(e => e.type === "PAYMENT").reduce((s, e) => s + Number(e.amount), 0);
  const totalRefunds = paidLedgerEntries.filter(e => e.type === "REFUND").reduce((s, e) => s + Number(e.amount), 0);
  const netRevenue = totalPayments - totalRefunds;

  // 2. EXPECTED INCOME (Accounts Receivable)
  const expectedIncome = pendingInvoices.reduce((s, e) => s + Number(e.amount), 0);

  // 3. OVERDUE CASH (Money that is late)
  const overdueInvoices = pendingInvoices.filter(inv => inv.dueDate && new Date(inv.dueDate) < now);
  const overdueCash = overdueInvoices.reduce((s, e) => s + Number(e.amount), 0);

  // 4. PORTFOLIO HEALTH %
  const activePipelineDeals = allActiveDeals.filter(d => ["RESERVED", "ACTIVE", "AT_RISK"].includes(d.status));
  const overdueDealIds = new Set(overdueInvoices.map(inv => inv.opportunityId));
  const dealsAtRiskCount = overdueDealIds.size;
  const healthyDealsCount = activePipelineDeals.length - dealsAtRiskCount;
  const healthPercent = activePipelineDeals.length > 0 ? Math.round((healthyDealsCount / activePipelineDeals.length) * 100) : 100;

  // Total Pipeline Value
  const totalExpectedValue = activePipelineDeals.reduce((sum, deal) => {
    return sum + (deal.financingMethod === "MORTGAGE" ? Number(deal.property.mortgagePrice) : Number(deal.property.cashPrice));
  }, 0);

  // Group Overdue Invoices by Client for the Action Feed
  const atRiskAccounts = Array.from(overdueDealIds).map(dealId => {
    const dealInvoices = overdueInvoices.filter(i => i.opportunityId === dealId);
    const deal = activePipelineDeals.find(d => d.id === dealId);
    const totalDue = dealInvoices.reduce((s, i) => s + Number(i.amount), 0);
    return { deal, totalDue, invoiceCount: dealInvoices.length };
  }).filter(acc => acc.deal !== undefined);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">General Manager HQ</h1>
        <p className="text-slate-500 mt-1">Live financial and operational telemetry for your portfolio.</p>
      </div>

      {/* ROW 1: THE MONEY (Financials) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex items-center gap-4 text-white">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cash Collected</p>
            <h2 className="text-2xl font-bold text-white">KSh {(netRevenue / 1000000).toFixed(2)}M</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Income</p>
            <h2 className="text-2xl font-bold text-slate-900">KSh {(expectedIncome / 1000000).toFixed(2)}M</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-red-500"></div>
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Overdue Cash</p>
            <h2 className="text-2xl font-bold text-slate-900">KSh {overdueCash.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pipeline</p>
            <h2 className="text-2xl font-bold text-slate-900">KSh {(totalExpectedValue / 1000000).toFixed(1)}M</h2>
          </div>
        </div>
      </div>

      {/* ROW 2: THE OPERATIONS */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className={`w-5 h-5 ${healthPercent > 80 ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="text-sm font-bold text-slate-600">Pipeline Health</span>
          </div>
          <span className={`text-lg font-bold ${healthPercent > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{healthPercent}%</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-bold text-slate-600">Active Deals</span>
          </div>
          <span className="text-lg font-bold text-slate-900">{activePipelineDeals.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-bold text-slate-600">Units Available</span>
          </div>
          <span className="text-lg font-bold text-slate-900">{availableProperties}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold text-slate-600">Client Network</span>
          </div>
          <span className="text-lg font-bold text-slate-900">{totalContacts}</span>
        </div>
      </div>

      {/* ROW 3: ACTION FEEDS */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Left Column: Accounts at Risk */}
        <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-red-50/30">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" /> Accounts at Risk (Overdue)
            </h3>
            <Link href="/ledger" className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider">Resolve</Link>
          </div>
          <div className="flex-1">
            {atRiskAccounts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6" />
                </div>
                <p className="text-slate-900 font-bold">Zero Overdue Accounts</p>
                <p className="text-slate-500 text-sm mt-1">Your entire pipeline is paying on time.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {atRiskAccounts.map((acc, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-sm uppercase">
                        {acc.deal?.contact.firstName.charAt(0)}{acc.deal?.contact.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{acc.deal?.contact.firstName} {acc.deal?.contact.lastName}</p>
                        <p className="text-xs text-slate-500">Unit {acc.deal?.property.unitNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-sm">KSh {acc.totalDue.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{acc.invoiceCount} Late Payments</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Cash Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" /> Live Cash Deposits
            </h3>
            <Link href="/ledger" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">View Ledger</Link>
          </div>
          <div className="flex-1">
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No recent payments recorded.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPayments.map(payment => {
                  const contact = payment.opportunity.contact;
                  return (
                    <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <ArrowDownRight className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{contact.firstName} {contact.lastName}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{payment.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">+ KSh {Number(payment.amount).toLocaleString()}</p>
                        <p className="text-xs text-slate-400">{new Date(payment.paidDate || payment.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}