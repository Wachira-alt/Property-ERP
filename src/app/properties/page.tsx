import prisma from "@/lib/prisma";
import { AddPropertyModal } from "@/components/AddPropertyModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PropertyActions } from "./PropertyActions";

export default async function PropertiesPage() {
  const [rawProperties, projects] = await Promise.all([
    prisma.property.findMany({
      orderBy: { unitNumber: "asc" },
      include: { project: true }, 
    }),
    prisma.project.findMany({
      orderBy: { name: "asc" },
    })
  ]);

  // Convert Decimal objects to standard numbers for Client Component compatibility
  const properties = rawProperties.map(p => ({
    ...p,
    cashPrice: Number(p.cashPrice),
    mortgagePrice: Number(p.mortgagePrice)
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory Control</h1>
          <p className="text-slate-500 mt-1">Manage units, pricing, and availability.</p>
        </div>
        <AddPropertyModal projects={projects} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Cash Price</TableHead>
              <TableHead>Mortgage Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No properties found. Click "Add Unit" to create one.
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium text-slate-900">{property.unitNumber}</TableCell>
                  <TableCell>{property.project?.name || "Unassigned"}</TableCell>
                  <TableCell className="font-medium text-emerald-700">
                    KSh {property.cashPrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    KSh {property.mortgagePrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={property.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <PropertyActions propertyId={property.id} />
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
    RESERVED: "bg-amber-100 text-amber-800 border-amber-200",
    SOLD: "bg-blue-100 text-blue-800 border-blue-200",
    BLOCKED: "bg-red-100 text-red-800 border-red-200",
  };
  return <Badge variant="outline" className={styles[status] || "bg-slate-100"}>{status}</Badge>;
}