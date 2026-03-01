"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Action to create a Project
export async function createProject(formData: FormData) {
  const name = formData.get("name") as string;
  const location = formData.get("location") as string;

  await prisma.project.create({
    data: { name, location }
  });

  revalidatePath("/projects");
}

// Action to create a Staff Member (Agent/Admin)
export async function createStaff(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as any;

  await prisma.user.create({
    data: { name, email, role }
  });

  revalidatePath("/team");
}