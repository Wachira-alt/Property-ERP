import prisma from "@/lib/prisma";
import { AddOpportunityModal } from "@/components/AddOpportunityModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PipelineActions } from "./PipelineActions";
import { DownloadOfferBtn } from "@/components/DownloadOfferBtn";

export default async function OpportunitiesPage() {
  const [deals, availableContacts, availableProperties] = await Promise.all([
    prisma.opportunity.findMany({
      include: { 
        contact: true, 
        property: { include: { project: true } }, 
        agent: true 
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contact.findMany({ orderBy: { lastName: "asc" } }),
    prisma.property.findMany({ where: { status: "AVAILABLE" } })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-500 mt-1">Track active reservations and deals.</p>
        </div>
        <AddOpportunityModal contacts={availableContacts} properties={availableProperties} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Agreed Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No deals found. Click "New Deal" to reserve a unit.
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => {
                const agreedPrice = deal.financingMethod === "MORTGAGE" 
                  ? Number(deal.property.mortgagePrice) 
                  : Number(deal.property.cashPrice);

                return (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{deal.contact.firstName} {deal.contact.lastName}</div>
                      <div className="text-xs text-slate-500">{deal.contact.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{deal.property.unitNumber}</div>
                      <div className="text-xs text-slate-500">{deal.property.project?.name || "Unassigned"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={deal.financingMethod === "CASH" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}>
                        {deal.financingMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-slate-900">
                          KSh {agreedPrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </div>
                        <DownloadOfferBtn deal={deal} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <PipelineBadge status={deal.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Kept your original prop structure here so it doesn't break! */}
                      <PipelineActions deal={deal} /> 
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// SMART PIPELINE BADGE (Translates business logic to colors)
// ----------------------------------------------------------------------------
function PipelineBadge({ status }: { status: string }) {
  const styles: Record<string, { color: string, label: string }> = {
    ACTIVE: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Active (Deposit Paid)" },
    RESERVED: { color: "bg-amber-100 text-amber-800 border-amber-200", label: "Reserved (Awaiting Deposit)" },
    AT_RISK: { color: "bg-orange-100 text-orange-800 border-orange-200", label: "At Risk (Overdue)" },
    CANCELLED: { color: "bg-red-100 text-red-800 border-red-200", label: "Cancelled (Available)" },
    COMPLETED: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "Completed (Fully Paid)" },
  };

  const config = styles[status] || { color: "bg-slate-100", label: status };

  return <Badge variant="outline" className={`${config.color} font-medium`}>{config.label}</Badge>;
}