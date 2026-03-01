import prisma from "@/lib/prisma";
import { AddContactModal } from "@/components/AddContactModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User2, Phone, Mail } from "lucide-react";

export default async function ContactsPage() {
  const [contacts, agents] = await Promise.all([
    prisma.contact.findMany({
      include: { agent: true },
      orderBy: { lastName: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "SALES" }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Master Registry</h1>
          <p className="text-slate-500 mt-1">Manage all prospected leads and clients.</p>
        </div>
        <AddContactModal agents={agents} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Contact Details</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  No clients registered. Click "Add Client" to begin.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium text-slate-900">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-xs text-slate-600">
                        <Mail className="w-3 h-3 mr-1" /> {contact.email}
                      </div>
                      <div className="flex items-center text-xs text-slate-600">
                        <Phone className="w-3 h-3 mr-1" /> {contact.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.agent ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                          {contact.agent.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{contact.agent.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                      {contact.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Placeholder for Edit/Delete actions */}
                    <button className="text-slate-400 hover:text-slate-600">Edit</button>
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