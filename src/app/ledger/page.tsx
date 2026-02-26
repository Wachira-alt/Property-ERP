import prisma from "@/lib/prisma";
import { AddLedgerModal } from "@/components/AddLedgerModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function LedgerPage() {
  // 1. Fetch all financial records, including the client and unit details
  // FIX: Changed from prisma.ledger to prisma.ledgerEntry
  const entries = await prisma.ledgerEntry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      opportunity: {
        include: {
          contact: true,
          property: true,
        }
      }
    }
  });

  // 2. Fetch active deals for the dropdown to link money to specific sales
  const activeDeals = await prisma.opportunity.findMany({
    include: { contact: true, property: true }
  });

  // 3. Clean the deals data for the Client Component
  const cleanDeals = activeDeals.map(deal => ({
    id: deal.id,
    clientName: `${deal.contact.firstName} ${deal.contact.lastName}`,
    unit: deal.property.unitNumber,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Ledger</h1>
          <p className="text-slate-500 mt-1">Track invoices, expected payments, and cash flow.</p>
        </div>
        <AddLedgerModal deals={cleanDeals} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Client & Unit</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Ref</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No financial records found. Click "Log Transaction" to start.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <span className="font-semibold text-slate-700">{entry.type}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {entry.opportunity.contact.firstName} {entry.opportunity.contact.lastName}
                    </div>
                    <div className="text-xs text-slate-500">
                      Unit {entry.opportunity.property.unitNumber}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {entry.dueDate ? new Date(entry.dueDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {entry.reference || "-"}
                  </TableCell>
                  <TableCell>
                    <LedgerBadge status={entry.status} />
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

function LedgerBadge({ status }: { status: string }) {
  const isPaid = status === "PAID";
  return (
    <Badge variant="outline" className={isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
      {status}
    </Badge>
  );
}