import prisma from "@/lib/prisma";
import { AddPropertyModal } from "@/components/AddPropertyModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function PropertiesPage() {
  // 1. Fetch data directly from the database
  const properties = await prisma.property.findMany({
    orderBy: { unitNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory Control</h1>
          <p className="text-slate-500 mt-1">Manage units, pricing, and availability.</p>
        </div>
        {/* Using the Shadcn Modal we built! */}
        <AddPropertyModal />
      </div>

      {/* Shadcn Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Size (Sq Ft)</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  No properties found. Click "Add Property" to create one.
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium text-slate-900">{property.unitNumber}</TableCell>
                  <TableCell>{property.projectName}</TableCell>
                  <TableCell>{property.size}</TableCell>
                  <TableCell>
                    ${Number(property.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={property.status} />
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

// Helper component using Shadcn Badge
function StatusBadge({ status }: { status: string }) {
  // We override the default Shadcn badge colors with your specific semantic colors
  const styles: Record<string, string> = {
    AVAILABLE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
    RESERVED: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
    SOLD: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
    BLOCKED: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  };

  const badgeStyle = styles[status] || "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <Badge variant="outline" className={badgeStyle}>
      {status}
    </Badge>
  );
}