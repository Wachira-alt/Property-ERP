"use client";

import { deleteLedgerEntry } from "@/app/actions";
import { MoreHorizontal, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { PaymentReceipt } from "@/components/pdf/PaymentReceipt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

// UPGRADE: We now pass the whole 'entry' object so the PDF has the data it needs
export function LedgerActions({ entry }: { entry: any }) {
  
  async function handleDelete() {
    if (confirm("Delete this financial record?")) {
      await deleteLedgerEntry(entry.id);
    }
  }

  const isPaidReceipt = entry.type === "PAYMENT" && entry.status === "PAID";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        
        {/* Only show the PDF button if money was actually received */}
        {isPaidReceipt && (
          <>
            <PDFDownloadLink 
              document={<PaymentReceipt entry={entry} />} 
              fileName={`Receipt_${entry.opportunity.property.unitNumber}.pdf`}
            >
              {({ loading }) => (
                <DropdownMenuItem disabled={loading} className="text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50 cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" /> 
                  {loading ? "Generating..." : "Download Receipt"}
                </DropdownMenuItem>
              )}
            </PDFDownloadLink>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Entry
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}