"use client";

import { deleteProperty } from "@/app/actions";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PropertyActions({ propertyId }: { propertyId: string }) {
  
  async function handleDelete() {
    if (confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      const res = await deleteProperty(propertyId);
      if (res?.error) {
        alert(res.error); // Will trigger if the property is linked to a deal
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
        <DropdownMenuItem className="text-slate-600" onClick={() => alert("Edit modal coming soon!")}>
          <Edit className="mr-2 h-4 w-4" /> Edit Unit
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Unit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}