import prisma from "@/lib/prisma";
import { AddOpportunityModal } from "@/components/AddOpportunityModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PipelineActions } from "./PipelineActions"; // We will create this client component next

export default async function OpportunitiesPage() {
  const deals = await prisma.opportunity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contact: true,
      property: true,
      agent: true,
      ledger: true, // We include the ledger to calculate financial progress!
    }
  });

  const rawContacts = await prisma.contact.findMany({ orderBy: { firstName: "asc" } });
  const rawProperties = await prisma.property.findMany({ 
    where: { status: "AVAILABLE" },
    orderBy: { unitNumber: "asc" } 
  });

  const cleanContacts = rawContacts.map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName }));
  const cleanProperties = rawProperties.map(p => ({ id: p.id, unitNumber: p.unitNumber, projectName: p.projectName }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-500 mt-1">Manage active deals and stage progression.</p>
        </div>
        <AddOpportunityModal contacts={cleanContacts} properties={cleanProperties} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Financial Progress</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">Pipeline is empty.</TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => {
                // SMART MATH: Calculate total paid vs property price
                const propertyPrice = Number(deal.property.price);
                const totalPaid = deal.ledger
                  .filter(l => l.type === "PAYMENT" && l.status === "PAID")
                  .reduce((sum, l) => sum + Number(l.amount), 0);
                const percentPaid = Math.min(Math.round((totalPaid / propertyPrice) * 100), 100);

                return (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium text-slate-900">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{deal.property.unitNumber}</div>
                      <div className="text-xs text-slate-500">{deal.property.projectName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">${totalPaid.toLocaleString()} / ${propertyPrice.toLocaleString()}</div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${percentPaid}%` }}></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={deal.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Dropdown Menu Component */}
                      <PipelineActions dealId={deal.id} currentStatus={deal.status} />
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

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    GREEN: "bg-emerald-100 text-emerald-800 border-emerald-200",
    AMBER_1: "bg-amber-100 text-amber-800 border-amber-200",
    AMBER_2: "bg-orange-100 text-orange-800 border-orange-200",
    RED: "bg-red-100 text-red-800 border-red-200",
  };
  return <Badge variant="outline" className={styles[stage] || "bg-slate-100"}>{stage.replace("_", " ")}</Badge>;
}