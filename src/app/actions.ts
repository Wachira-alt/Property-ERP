"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- 1. PROPERTY ACTIONS ---
const PropertySchema = z.object({
  unitNumber: z.string().min(1, "Unit Number is required"),
  projectName: z.string().min(1, "Project Name is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  size: z.coerce.number().min(0, "Size must be positive"),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "BLOCKED"]),
});

export async function addProperty(formData: FormData) {
  const rawData = {
    unitNumber: formData.get("unitNumber"),
    projectName: formData.get("projectName"),
    price: formData.get("price"),
    size: formData.get("size"),
    status: formData.get("status"),
  };

  const validatedData = PropertySchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  try {
    await prisma.property.create({
      data: validatedData.data,
    });
    revalidatePath("/properties");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to create property. Unit number might already exist." };
  }
}

// --- 2. CONTACT ACTIONS ---
const ContactSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  type: z.enum(["LEAD", "ACTIVE_BUYER", "PAST_CLIENT"]),
  source: z.string().optional(),
});

export async function addContact(formData: FormData) {
  const rawData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    type: formData.get("type"),
    source: formData.get("source"),
  };

  const validatedData = ContactSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  try {
    await prisma.contact.create({
      data: validatedData.data,
    });
    revalidatePath("/contacts");
    return { success: true };
  } catch (error: any) {
    console.error("Database Error:", error);
    return { error: "Failed to create contact. Email might already exist." };
  }
}

// --- 3. OPPORTUNITY (PIPELINE) ACTIONS ---
const OpportunitySchema = z.object({
  contactId: z.string().min(1, "Client is required"),
  propertyId: z.string().min(1, "Property is required"),
  status: z.enum(["GREEN", "AMBER_1", "AMBER_2", "RED"]),
});

export async function addOpportunity(formData: FormData) {
  const rawData = {
    contactId: formData.get("contactId"),
    propertyId: formData.get("propertyId"),
    status: formData.get("status"),
  };

  const validatedData = OpportunitySchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  try {
    // Failsafe: Get or create a dummy user since Auth isn't setup yet
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { email: "admin@properp.com", name: "System Admin", role: "ADMIN" }
      });
    }

    // SAFETY CHECK: Ensure the property is actually free before writing
    const isTaken = await prisma.opportunity.findUnique({
      where: { propertyId: validatedData.data.propertyId }
    });

    if (isTaken) {
      return { error: "This property already has an active deal!" };
    }

    // Transaction: Create the deal AND reserve the unit simultaneously
    await prisma.$transaction([
      prisma.opportunity.create({
        data: {
          contactId: validatedData.data.contactId,
          propertyId: validatedData.data.propertyId,
          agentId: user.id,
          status: validatedData.data.status,
        },
      }),
      prisma.property.update({
        where: { id: validatedData.data.propertyId },
        data: { status: "RESERVED" }, 
      }),
    ]);

    revalidatePath("/opportunities");
    revalidatePath("/properties"); 
    return { success: true };
    
  } catch (error: any) {
    console.error("Database Error:", error);
    // Catch the specific Unique Constraint violation
    if (error.code === 'P2002') {
       return { error: "Double Booking Blocked: This unit already has an active deal." };
    }
    return { error: "Failed to create deal." };
  }
}

// --- 4. LEDGER (FINANCIAL) ACTIONS ---
const LedgerSchema = z.object({
  opportunityId: z.string().min(1, "Deal is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  type: z.enum(["INVOICE", "PAYMENT"]),
  status: z.enum(["PENDING", "PAID"]),
  dueDate: z.string().optional(),
  reference: z.string().optional(),
});

export async function addLedgerEntry(formData: FormData) {
  const rawData = {
    opportunityId: formData.get("opportunityId"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    status: formData.get("status"),
    dueDate: formData.get("dueDate"),
    reference: formData.get("reference"),
  };

  const validatedData = LedgerSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.flatten().fieldErrors };
  }

  try {
    // FIX: Using correct model name 'ledgerEntry' and adding Enum casts
    await prisma.ledgerEntry.create({
      data: {
        opportunityId: validatedData.data.opportunityId,
        type: validatedData.data.type as any, 
        amount: validatedData.data.amount,
        status: validatedData.data.status as any, 
        dueDate: validatedData.data.dueDate ? new Date(validatedData.data.dueDate) : null,
        paidDate: validatedData.data.status === "PAID" ? new Date() : null,
        reference: validatedData.data.reference || null,
      },
    });

    revalidatePath("/ledger");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to log financial entry." };
  }
}