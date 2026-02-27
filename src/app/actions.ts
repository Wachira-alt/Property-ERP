"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// MODULE 1: INVENTORY (PROPERTIES)
// ============================================================================

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
  if (!validatedData.success) return { error: validatedData.error.flatten().fieldErrors };

  try {
    await prisma.property.create({ data: validatedData.data });
    revalidatePath("/properties");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to create property. Unit number might already exist." };
  }
}

export async function deleteProperty(propertyId: string) {
  try {
    // SAFETY CHECK: Prevent deleting properties that are linked to a deal
    const linkedDeal = await prisma.opportunity.findUnique({ where: { propertyId: propertyId } });
    if (linkedDeal) return { error: "Cannot delete this unit. It is currently linked to an active deal." };

    await prisma.property.delete({ where: { id: propertyId } });
    revalidatePath("/properties");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to delete property." };
  }
}

// ============================================================================
// MODULE 2: MASTER REGISTRY (CONTACTS)
// ============================================================================

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
  if (!validatedData.success) return { error: validatedData.error.flatten().fieldErrors };

  try {
    await prisma.contact.create({ data: validatedData.data });
    revalidatePath("/contacts");
    return { success: true };
  } catch (error: any) {
    console.error("Database Error:", error);
    return { error: "Failed to create contact. Email might already exist." };
  }
}

export async function deleteContact(contactId: string) {
  try {
    // SAFETY CHECK: Prevent deleting a client who has active deals
    const linkedDeals = await prisma.opportunity.findFirst({ where: { contactId: contactId } });
    if (linkedDeals) return { error: "Cannot delete this contact. They are linked to an existing deal." };

    await prisma.contact.delete({ where: { id: contactId } });
    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to delete contact." };
  }
}

// ============================================================================
// MODULE 3: THE PIPELINE (OPPORTUNITIES)
// ============================================================================

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
  if (!validatedData.success) return { error: validatedData.error.flatten().fieldErrors };

  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { email: "admin@properp.com", name: "System Admin", role: "ADMIN" } });
    }

    const isTaken = await prisma.opportunity.findUnique({ where: { propertyId: validatedData.data.propertyId } });
    if (isTaken) return { error: "This property already has an active deal!" };

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
    if (error.code === 'P2002') return { error: "Double Booking Blocked: This unit already has an active deal." };
    return { error: "Failed to create deal." };
  }
}

export async function updateOpportunityStatus(opportunityId: string, newStatus: string) {
  try {
    const deal = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!deal) return { error: "Deal not found." };

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: newStatus as any },
    });

    // AUTOMATION: Auto-release or auto-reserve property based on Deal Status
    if (newStatus === "RED") {
      await prisma.property.update({ where: { id: deal.propertyId }, data: { status: "AVAILABLE" } });
    } else if (deal.status === "RED" && newStatus !== "RED") {
      await prisma.property.update({ where: { id: deal.propertyId }, data: { status: "RESERVED" } });
    }

    revalidatePath("/opportunities");
    revalidatePath("/properties");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to update status." };
  }
}

export async function deleteOpportunity(opportunityId: string) {
  try {
    const deal = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!deal) return { error: "Deal not found." };

    await prisma.$transaction([
      prisma.opportunity.delete({ where: { id: opportunityId } }),
      prisma.property.update({ where: { id: deal.propertyId }, data: { status: "AVAILABLE" } })
    ]);

    revalidatePath("/opportunities");
    revalidatePath("/properties");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Cannot delete deal. It might have financial records attached to it." };
  }
}

// ============================================================================
// MODULE 4: REVENUE OPS (LEDGER)
// ============================================================================

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
  if (!validatedData.success) return { error: validatedData.error.flatten().fieldErrors };

  try {
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

    // SMART AUTOMATION: If a payment comes in, automatically upgrade deal to GREEN
    if (validatedData.data.type === "PAYMENT" && validatedData.data.status === "PAID") {
      await prisma.opportunity.update({
        where: { id: validatedData.data.opportunityId },
        data: { status: "GREEN" }
      });
    }

    revalidatePath("/ledger");
    revalidatePath("/opportunities");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to log financial entry." };
  }
}
// Add this to the bottom of src/app/actions.ts

export async function deleteLedgerEntry(entryId: string) {
  try {
    await prisma.ledgerEntry.delete({ where: { id: entryId } });
    revalidatePath("/ledger");
    revalidatePath("/opportunities"); // Recalculate progress bars
    revalidatePath("/"); // Recalculate dashboard revenue
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to delete entry." };
  }
}

const PlanSchema = z.object({
  opportunityId: z.string().min(1, "Deal is required"),
  totalAmount: z.coerce.number().min(1),
  deposit: z.coerce.number().min(0),
  months: z.coerce.number().min(1).max(60),
  startDate: z.string().min(1, "Start date is required"),
});

export async function generatePaymentPlan(formData: FormData) {
  const rawData = {
    opportunityId: formData.get("opportunityId"),
    totalAmount: formData.get("totalAmount"),
    deposit: formData.get("deposit"),
    months: formData.get("months"),
    startDate: formData.get("startDate"),
  };

  const val = PlanSchema.safeParse(rawData);
  if (!val.success) return { error: val.error.flatten().fieldErrors };

  const { opportunityId, totalAmount, deposit, months, startDate } = val.data;
  const monthlyAmount = (totalAmount - deposit) / months;
  const start = new Date(startDate);

  try {
    // 1. Create the Deposit Invoice
    if (deposit > 0) {
      await prisma.ledgerEntry.create({
        data: {
          opportunityId,
          type: "INVOICE",
          status: "PENDING",
          amount: deposit,
          dueDate: start,
          reference: "Down Payment",
        },
      });
    }

    // 2. Loop to create the Monthly Installments
    const invoices = [];
    for (let i = 1; i <= months; i++) {
      const nextDate = new Date(start);
      nextDate.setMonth(start.getMonth() + i); // Add i months to start date

      invoices.push({
        opportunityId,
        type: "INVOICE",
        status: "PENDING",
        amount: monthlyAmount,
        dueDate: nextDate,
        reference: `Installment ${i}/${months}`,
      });
    }

    // Bulk insert for speed
    await prisma.ledgerEntry.createMany({ data: invoices as any });

    revalidatePath("/ledger");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to generate plan." };
  }
}