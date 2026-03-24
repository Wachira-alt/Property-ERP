"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string;
  const location = formData.get("location") as string;

  await prisma.project.create({
    data: { name, location }
  });

  revalidatePath("/admin/projects");
}

export async function createUnitType(formData: FormData) {
  const name = formData.get("name") as string;
  const projectId = formData.get("projectId") as string;
  

  await prisma.unitType.create({
    data: { name, projectId }
  });

  revalidatePath("/admin/projects");
}

export async function createUnits(formData: FormData) {
  const unitTypeId = formData.get("unitTypeId") as string;
  const unitNumbersRaw = formData.get("unitNumbers") as string; // Matches your UI 'name'

  // Split by comma, remove whitespace, and filter out empty strings
  const unitList = unitNumbersRaw
    .split(",")
    .map((num) => num.trim())
    .filter((num) => num !== "");

  if (unitList.length === 0) return;

  const unitsData = unitList.map((number) => ({
    unitNumber: number,
    unitTypeId: unitTypeId,
    status: "AVAILABLE" as const, // Force matching the Enum
  }));

  await prisma.unit.createMany({
    data: unitsData,
  });

  revalidatePath("/admin/projects");
}

// Add this to fix the GlobalSearch error
export async function globalSearch(query: string) {
  const results = await prisma.contact.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
      ]
    },
    take: 5
  });
  return results;
}
/**
 * STAGE 1: HUMAN INFRASTRUCTURE
 * Registers a new staff member/agent into the system.
 */
export async function createStaff(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as any; // Matches your UserRole enum

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      // Default image or placeholder can be added here
    }
  });

  revalidatePath("/admin/team");
}