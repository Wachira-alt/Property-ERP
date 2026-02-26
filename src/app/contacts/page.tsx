import prisma from "@/lib/prisma";
import { AddContactModal } from "@/components/AddContactModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Master Registry</h1>
          <p className="text-slate-500 mt-1">Manage leads, buyers, and past clients.</p>
        </div>
        <AddContactModal />
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  No contacts found. Click "Add Contact" to create one.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium text-slate-900">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{contact.email}</div>
                    <div className="text-xs text-slate-500">{contact.phone}</div>
                  </TableCell>
                  <TableCell>
                    <ContactTypeBadge type={contact.type} />
                  </TableCell>
                  <TableCell className="text-slate-500">{contact.source || "-"}</TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(contact.createdAt).toLocaleDateString()}
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

function ContactTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    LEAD: "bg-slate-100 text-slate-800 border-slate-200",
    ACTIVE_BUYER: "bg-blue-100 text-blue-800 border-blue-200",
    PAST_CLIENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const badgeStyle = styles[type] || "bg-slate-100 text-slate-800";

  return (
    <Badge variant="outline" className={badgeStyle}>
      {type.replace("_", " ")}
    </Badge>
  );
}