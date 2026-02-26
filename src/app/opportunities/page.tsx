import prisma from "@/lib/prisma";
import { AddOpportunityModal } from "@/components/AddOpportunityModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function OpportunitiesPage() {
  // 1. Fetch the active pipeline
  const deals = await prisma.opportunity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contact: true,
      property: true,
      agent: true,
    }
  });

  // 2. Fetch data required for the "New Deal" dropdowns
  const rawContacts = await prisma.contact.findMany({ orderBy: { firstName: "asc" } });
  
  // Only fetch properties that haven't been sold or reserved yet!
  const rawProperties = await prisma.property.findMany({ 
    where: { status: "AVAILABLE" },
    orderBy: { unitNumber: "asc" } 
  });

  // FIX: Strip out the complex Decimal objects from Prisma. 
  // We only pass exactly what the frontend dropdown needs (id, unitNumber, projectName) as plain strings.
  const cleanContacts = rawContacts.map(c => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName
  }));

  const cleanProperties = rawProperties.map(p => ({
    id: p.id,
    unitNumber: p.unitNumber,
    projectName: p.projectName
  }));

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
              <TableHead>Unit / Project</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  Pipeline is empty. Click "New Deal" to start tracking.
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium text-slate-900">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{deal.property.unitNumber}</div>
                    <div className="text-xs text-slate-500">{deal.property.projectName}</div>
                  </TableCell>
                  <TableCell>
                    ${Number(deal.property.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {deal.agent.name || deal.agent.email}
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={deal.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    GREEN: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
    AMBER_1: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
    AMBER_2: "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200",
    RED: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  };

  const badgeStyle = styles[stage] || "bg-slate-100 text-slate-800";
  const label = stage === "AMBER_1" ? "AMBER 1" : stage === "AMBER_2" ? "AMBER 2" : stage;

  return (
    <Badge variant="outline" className={badgeStyle}>
      {label}
    </Badge>
  );
}