"use client";

import { updateOpportunityStatus, deleteOpportunity } from "@/app/actions";
import { MoreHorizontal, Trash2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PipelineActions({ dealId, currentStatus }: { dealId: string, currentStatus: string }) {
  
  async function handleStatusChange(status: string) {
    await updateOpportunityStatus(dealId, status);
  }

  async function handleDelete() {
    if (confirm("Are you sure? This will delete the deal and release the property.")) {
      const res = await deleteOpportunity(dealId);
      if (res?.error) alert(res.error);
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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => handleStatusChange("GREEN")} className={currentStatus === "GREEN" ? "bg-slate-100" : ""}>
          <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Green (Active)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleStatusChange("AMBER_1")} className={currentStatus === "AMBER_1" ? "bg-slate-100" : ""}>
          <AlertCircle className="mr-2 h-4 w-4 text-amber-600" /> Amber 1 (Warm)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleStatusChange("RED")}>
          <XCircle className="mr-2 h-4 w-4 text-red-600" /> Red (Lost/Cancel)
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Deal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}