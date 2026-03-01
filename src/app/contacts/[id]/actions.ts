"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addNote(contactId: string, formData: FormData) {
  const content = formData.get("content") as string;
  const isTask = formData.get("isTask") === "true"; 
  const dueDateString = formData.get("dueDate") as string | null; // <-- Catch the date
  
  if (!content || content.trim() === "") return { error: "Note cannot be empty" };

  // Convert the string from the calendar into a real Date object
  let dueDate = null;
  if (isTask && dueDateString) {
    dueDate = new Date(dueDateString);
  }

  await prisma.note.create({
    data: {
      content,
      isTask,
      dueDate, // <-- Save it!
      contactId,
    }
  });

  revalidatePath(`/contacts/${contactId}`);
}

export async function toggleTask(noteId: string, contactId: string, currentState: boolean) {
  await prisma.note.update({
    where: { id: noteId },
    data: { isCompleted: !currentState } // Flips the checkbox
  });
  revalidatePath(`/contacts/${contactId}`);
}

export async function uploadDocument(contactId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file provided" };

  // Convert the raw file into a safe Base64 text string for the database
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64String = buffer.toString("base64");

  await prisma.document.create({
    data: {
      name: file.name,
      mimeType: file.type,
      fileData: base64String,
      contactId,
    }
  });

  revalidatePath(`/contacts/${contactId}`);
}