// src/app/actions/admin.ts
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
  const unitNumbersRaw = formData.get("unitNumbers") as string;

  const unitList = unitNumbersRaw
    .split(",")
    .map((num) => num.trim())
    .filter((num) => num !== "");

  if (unitList.length === 0) return;

  const unitsData = unitList.map((number) => ({
    unitNumber: number,
    unitTypeId: unitTypeId,
    status: "AVAILABLE" as const, // Phase 1, Step 2: Enforce Green status
  }));

  await prisma.unit.createMany({
    data: unitsData,
  });

  revalidatePath("/admin/projects");
}

export async function createStaff(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as any;

  await prisma.user.create({
    data: { name, email, role }
  });

  revalidatePath("/admin/team");
}