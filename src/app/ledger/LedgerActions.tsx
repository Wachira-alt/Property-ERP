"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLedgerEntries(opportunityId: string, contactId: string, rows: any[]) {
  // 1. Clear existing
  await prisma.ledgerEntry.deleteMany({ where: { opportunityId } });

  // 2. Validate and Create
  await prisma.ledgerEntry.createMany({
    data: rows.map(row => {
      // Ensure the date is valid, fallback to today if it's broken
      const parsedDate = new Date(row.dueDate);
      const finalDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      return {
        opportunityId,
        description: row.description || "Installment",
        amount: parseFloat(row.amount) || 0,
        dueDate: finalDate, // FIX: No more "Invalid Date"
        status: "PENDING",
        type: row.description?.toLowerCase().includes('deposit') || row.description?.toLowerCase().includes('booking') 
               ? "DEPOSIT" : "INSTALLMENT"
      };
    })
  });

  revalidatePath(`/contacts/${contactId}`);
}