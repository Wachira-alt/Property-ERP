import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, Users, Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  // 1. Fetch all our dashboard metrics in parallel for speed
  const [
    totalProperties,
    availableProperties,
    activeDeals,
    revenueData,
    pendingData,
    recentDeals
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { status: "AVAILABLE" } }),
    prisma.opportunity.count({ where: { status: { not: "RED" } } }),
    
    // Sum up all PAID PAYMENTS (Actual Cash in Bank)
    prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { type: "PAYMENT", status: "PAID" }
    }),
    
    // Sum up all PENDING INVOICES (Money Owed to you)
    prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { type: "INVOICE", status: "PENDING" }
    }),

    // Get the 5 most recent deals for the activity feed
    prisma.opportunity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { contact: true, property: true }
    })
  ]);

  // Safely convert the database Decimals to standard JavaScript Numbers
  const totalRevenue = Number(revenueData._sum.amount || 0);
  const pendingReceivables = Number(pendingData._sum.amount || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here is what is happening today.</p>
      </div>

      {/* --- Top Metrics Row --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Cash collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Receivables</CardTitle>
            <Activity className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${pendingReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Unpaid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Deals</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeDeals}</div>
            <p className="text-xs text-slate-500 mt-1">Opportunities in pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Available Units</CardTitle>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {availableProperties} <span className="text-sm font-normal text-slate-500">/ {totalProperties}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Ready to sell</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Recent Activity Section --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Deals</CardTitle>
              <p className="text-sm text-slate-500">Latest pipeline activity</p>
            </div>
            <Link href="/opportunities" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentDeals.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No deals created yet.</p>
              ) : (
                recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                        {deal.contact.firstName.charAt(0)}{deal.contact.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {deal.contact.firstName} {deal.contact.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Reserved Unit {deal.property.unitNumber}
                        </p>
                      </div>
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
      </div>
    </div>
  );
}