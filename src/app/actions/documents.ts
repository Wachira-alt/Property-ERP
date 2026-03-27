// src/app/actions/documents.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * FINAL GATEKEEPER: Hard-locks the sale only if all 4 docs are present.
 */
export async function finalizeSale(opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { contact: true, unit: true }
  });

  if (!opportunity) throw new Error("Opportunity not found");

  // Verification Logic: Check for all 4 URLs in the database
  const { idDocumentUrl, kraDocumentUrl, signedOfferUrl, bookingFeeUrl } = opportunity.contact;
  
  if (!idDocumentUrl || !kraDocumentUrl || !signedOfferUrl || !bookingFeeUrl) {
    throw new Error("Missing documents. Required: ID, KRA, Signed Offer, and Booking Receipt.");
  }

  // Atomic Transaction: Unit becomes SOLD, Opportunity becomes CLOSED
  await prisma.$transaction([
    prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: "CLOSED" }
    }),
    prisma.unit.update({
      where: { id: opportunity.unitId },
      data: { status: "SOLD", holdExpiresAt: null }
    })
  ]);

  revalidatePath(`/contacts/${opportunity.contactId}`);
  return { success: true };
}

/**
 * Updates document slots for the Contact
 */
export async function updateContactDocuments(contactId: string, data: {
  idDocumentUrl?: string;
  kraDocumentUrl?: string;
  signedOfferUrl?: string;
  bookingFeeUrl?: string;
}) {
  const updated = await prisma.contact.update({
    where: { id: contactId },
    data
  });
  revalidatePath(`/contacts/${contactId}`);
  return updated;
}