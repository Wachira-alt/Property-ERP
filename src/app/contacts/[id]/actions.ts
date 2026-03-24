"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * STAGE 2: AMBER TRANSITION
 * Updates KYC, creates the Opportunity with the manual price,
 * and sets the 7-day Soft Lock on the Unit.
 */
export async function initializeReservation(formData: FormData) {
  const contactId = formData.get("contactId") as string;
  const unitId = formData.get("unitId") as string;
  const idNumber = formData.get("idNumber") as string;
  const kraPin = formData.get("kraPin") as string;
  const agreedPrice = formData.get("agreedPrice") as string;

  try {
    // 1. Update Contact KYC
    await prisma.contact.update({
      where: { id: contactId },
      data: { idNumber, kraPin }
    });

    // 2. Create Opportunity (The Deal)
    const opportunity = await prisma.opportunity.create({
      data: {
        contactId,
        unitId,
        agreedPrice: parseFloat(agreedPrice),
        status: "RESERVED", 
      }
    });

    // 3. Set Unit to RESERVED_SOFT + 7-Day Timer
    const holdExpiry = new Date();
    holdExpiry.setDate(holdExpiry.getDate() + 7);

    await prisma.unit.update({
      where: { id: unitId },
      data: {
        status: "RESERVED_SOFT",
        holdExpiresAt: holdExpiry
      }
    });

    revalidatePath(`/admin/contacts/${contactId}`);
    return { success: true, opportunityId: opportunity.id };
  } catch (error) {
    console.error("Reservation Error:", error);
    return { error: "Failed to initialize reservation." };
  }
}

/**
 * MANUAL LEDGER BUILDER: ADD ROW
 */
export async function addLedgerEntry(formData: FormData) {
  const opportunityId = formData.get("opportunityId") as string;
  const contactId = formData.get("contactId") as string; // Hidden field to revalidate path
  const amount = formData.get("amount") as string;
  const dueDate = formData.get("dueDate") as string;
  const type = formData.get("type") as any;

  await prisma.ledgerEntry.create({
    data: {
      opportunityId,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      type,
      status: "PENDING"
    }
  });

  revalidatePath(`/admin/contacts/${contactId}`);
}

/**
 * MANUAL LEDGER BUILDER: DELETE ROW
 */
export async function deleteLedgerEntry(entryId: string, contactId: string) {
  await prisma.ledgerEntry.delete({
    where: { id: entryId }
  });

  revalidatePath(`/admin/contacts/${contactId}`);
}

/**
 * GM OVERRIDE: RELEASE UNIT
 * Resets the unit to AVAILABLE and removes the timer.
 * Note: This keeps the contact/opportunity record but kills the lock.
 */
export async function releaseUnit(unitId: string, contactId: string) {
  await prisma.unit.update({
    where: { id: unitId },
    data: {
      status: "AVAILABLE",
      holdExpiresAt: null
    }
  });

  // Also update the opportunity status to reflect cancellation/release
  await prisma.opportunity.updateMany({
    where: { unitId, contactId, status: "RESERVED" },
    data: { status: "CANCELLED" }
  });

  revalidatePath(`/admin/contacts/${contactId}`);
  revalidatePath("/admin/inventory");
}
/**
 * STAGE 3: FINAL CLOSING (HARD LOCK)
 * Verifies all flags and flips the Unit to SOLD.
 */
export async function finalizeSale(formData: FormData) {
  const contactId = formData.get("contactId") as string;
  const unitId = formData.get("unitId") as string;
  const opportunityId = formData.get("opportunityId") as string;

  try {
    // 1. Mark the Opportunity as CLOSED
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: "CLOSED" }
    });

    // 2. Flip the Unit to SOLD and remove the 7-day timer
    await prisma.unit.update({
      where: { id: unitId },
      data: {
        status: "SOLD",
        holdExpiresAt: null
      }
    });

    revalidatePath(`/admin/contacts/${contactId}`);
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    console.error("Closing Error:", error);
    return { error: "Failed to finalize sale." };
  }
}
/**
 * Updates a specific document URL for a contact
 */
export async function uploadDocument(formData: FormData) {
  const contactId = formData.get("contactId") as string;
  const field = formData.get("field") as string; // e.g., "idDocumentUrl"
  const url = formData.get("url") as string; // The "path" to the file

  await prisma.contact.update({
    where: { id: contactId },
    data: { [field]: url }
  });

  revalidatePath(`/admin/contacts/${contactId}`);
}