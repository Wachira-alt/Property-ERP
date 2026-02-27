import prisma from "@/lib/prisma";
import { AddPropertyModal } from "@/components/AddPropertyModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PropertyActions } from "./PropertyActions";

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { unitNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory Control</h1>
          <p className="text-slate-500 mt-1">Manage units, pricing, and availability.</p>
        </div>
        <AddPropertyModal />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead className="bg-blue-50/50">Price / Sq Ft</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  No properties found. Click "Add Property" to create one.
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => {
                // SMART MATH: Calculate Price per Square Foot on the fly
                const price = Number(property.price);
                const ppsf = property.size > 0 ? (price / property.size) : 0;

                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium text-slate-900">{property.unitNumber}</TableCell>
                    <TableCell>{property.projectName}</TableCell>
                    <TableCell>{property.size} sqft</TableCell>
                    <TableCell className="font-medium">
                      ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-blue-700 font-semibold bg-blue-50/10">
                      ${ppsf.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={property.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <PropertyActions propertyId={property.id} />
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
    RESERVED: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
    SOLD: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
    BLOCKED: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  };
  return <Badge variant="outline" className={styles[status] || "bg-slate-100"}>{status}</Badge>;
}