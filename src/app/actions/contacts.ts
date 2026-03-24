"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * STAGE 2: INTAKE (GREEN)
 */
export async function createContact(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phone = formData.get("phone") as string;
  const projectId = formData.get("projectId") as string;
  const interestedUnitId = formData.get("interestedUnitId") as string;
  const sourcingAgentId = formData.get("sourcingAgentId") as string;

  await prisma.contact.create({
    data: {
      firstName,
      lastName,
      phone,
      interestedProjectId: projectId === "" ? null : projectId,
      interestedUnitId: interestedUnitId === "" ? null : interestedUnitId,
      sourcingAgentId: (sourcingAgentId === "organic" || sourcingAgentId === "") ? null : sourcingAgentId,
    }
  });

  revalidatePath("/contacts");
}

/**
 * STAGE 3: SOFT-LOCK (AMBER)
 * Transitions lead to reservation, saves payment method, and starts the 7-day timer.
 */
export async function initializeReservation(formData: FormData) {
  const contactId = formData.get("contactId") as string;
  const unitId = formData.get("unitId") as string;
  const agreedPrice = parseFloat(formData.get("agreedPrice") as string);
  const paymentMethod = formData.get("paymentMethod") as string;
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // 1. Create the Opportunity with the Payment Method
  const opportunity = await prisma.opportunity.create({
    data: {
      contactId,
      unitId,
      agreedPrice,
      paymentMethod, // NEW: Saved for Offer Letter logic
      status: "RESERVED",
    }
  });

  // 2. Update the Unit Status and Hold Timer
  await prisma.unit.update({
    where: { id: unitId },
    data: {
      status: "RESERVED",
      holdExpiresAt: expiresAt
    }
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/admin/projects");
  return opportunity;
}

/**
 * STAGE 4: HARD-LOCK (CLOSED)
 */
export async function finalizeSale(opportunityId: string, unitId: string, contactId: string) {
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { status: "CLOSED" }
  });

  await prisma.unit.update({
    where: { id: unitId },
    data: { 
      status: "SOLD",
      holdExpiresAt: null 
    }
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/ledger");
}