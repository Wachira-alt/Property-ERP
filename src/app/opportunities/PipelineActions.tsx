"use client";

import { useState } from "react";
import { updateOpportunityStatus, deleteOpportunity } from "@/app/actions";
import { MoreHorizontal, Trash2, CheckCircle, Clock, AlertTriangle, XCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function PipelineActions({ deal }: { deal: any }) {
  const [isPending, setIsPending] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setIsPending(true);
    await updateOpportunityStatus(deal.id, newStatus);
    setIsPending(false);
  }

  async function handleDelete() {
    if (confirm("Are you sure you want to permanently delete this deal? This action cannot be undone.")) {
      setIsPending(true);
      await deleteOpportunity(deal.id);
      setIsPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Update Deal Status</DropdownMenuLabel>
        
        {/* Only show these options if the deal isn't already finished */}
        {deal.status !== "COMPLETED" && (
          <>
            <DropdownMenuItem onClick={() => handleStatusChange("ACTIVE")} disabled={deal.status === "ACTIVE"}>
              <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Mark Active (Deposit)</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleStatusChange("RESERVED")} disabled={deal.status === "RESERVED"}>
              <Clock className="mr-2 h-4 w-4 text-amber-600" />
              <span>Mark Reserved (Booking)</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleStatusChange("AT_RISK")} disabled={deal.status === "AT_RISK"}>
              <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" />
              <span>Mark At Risk (Overdue)</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => handleStatusChange("CANCELLED")} disabled={deal.status === "CANCELLED"}>
              <XCircle className="mr-2 h-4 w-4 text-red-600" />
              <span>Cancel Deal (Available)</span>
            </DropdownMenuItem>
          </>
        )}

        {/* If somehow the system missed the auto-completion, let them force it */}
        {deal.status !== "COMPLETED" && (
            <DropdownMenuItem onClick={() => handleStatusChange("COMPLETED")}>
              <Star className="mr-2 h-4 w-4 text-purple-600" />
              <span>Force Complete (100%)</span>
            </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Record</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}