"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Vault Uploader: Saves mock or real storage URLs to the contact KYC fields.
 */
export async function uploadDocument(contactId: string, field: string, url: string) {
  await prisma.contact.update({
    where: { id: contactId },
    data: { [field]: url }
  });

  revalidatePath(`/contacts/${contactId}`);
}