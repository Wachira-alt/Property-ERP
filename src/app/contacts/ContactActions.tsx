"use client";

import { deleteContact } from "@/app/actions";
import { MoreHorizontal, Trash2, Edit, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export function ContactActions({ contactId }: { contactId: string }) {
  
  async function handleDelete() {
    if (confirm("Are you sure you want to remove this contact from the registry?")) {
      const res = await deleteContact(contactId);
      if (res?.error) {
        alert(res.error); // Will trigger if they have active deals
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="text-slate-600" onClick={() => alert("Email integration coming soon!")}>
          <Mail className="mr-2 h-4 w-4" /> Send Email
        </DropdownMenuItem>
        
        <DropdownMenuItem className="text-slate-600" onClick={() => alert("Edit modal coming soon!")}>
          <Edit className="mr-2 h-4 w-4" /> Edit Contact
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Contact
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}