"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// MODULE 0: SETUP HELPERS (PROJECTS & AGENTS)
// ============================================================================

export async function addProject(name: string, location?: string) {
  try {
    await prisma.project.create({ data: { name, location } });
    revalidatePath("/properties");
    return { success: true };
  } catch (error) {
    return { error: "Failed to add project. It might already exist." };
  }
}

export async function addAgent(name: string, email: string) {
  try {
    await prisma.user.create({ data: { name, email, role: "SALES" } });
    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    return { error: "Failed to add agent." };
  }
}

// ============================================================================
// MODULE 1: INVENTORY (PROPERTIES)
// ============================================================================

const PropertySchema = z.object({
  unitNumber: z.string().min(1, "Unit Number is required"),
  projectId: z.string().min(1, "Project is required"),
  cashPrice: z.coerce.number().min(0, "Cash Price must be positive"),
  mortgagePrice: z.coerce.number().min(0, "Mortgage Price must be positive"),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "BLOCKED"]),
});

export async function addProperty(formData: FormData) {
  const rawData = {
    unitNumber: formData.get("unitNumber"),
    projectId: formData.get("projectId"),
    cashPrice: formData.get("cashPrice"),
    mortgagePrice: formData.get("mortgagePrice"),
    status: formData.get("status"),
  };

  const validatedData = PropertySchema.safeParse(rawData);
  if (!validatedData.success) {
    console.error("Validation Error:", validatedData.error.flatten().fieldErrors);
    return { error: "Validation failed. Check your inputs." };
  }

  try {
    await prisma.property.create({ data: validatedData.data });
    revalidatePath("/properties");
    return { success: true };
  } catch (error: any) {
    console.error("Database Error:", error);
    return { error: `System Error: ${error.message || "Failed to create"}` };
  }
}

export async function deleteProperty(propertyId: string) {
  try {
    const linkedDeal = await prisma.opportunity.findUnique({ where: { propertyId } });
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
  source: z.string().optional(),
  agentId: z.string().optional(), 
});

export async function addContact(formData: FormData) {
  const rawData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source") || undefined,
    agentId: formData.get("agentId") || undefined, 
  };

  const validatedData = ContactSchema.safeParse(rawData);
  if (!validatedData.success) {
    console.error("Zod Validation Error:", validatedData.error.flatten().fieldErrors);
    return { error: validatedData.error.flatten().fieldErrors };
  }

  try {
    await prisma.contact.create({ data: validatedData.data });
    revalidatePath("/contacts");
    return { success: true };
  } catch (error: any) {
    console.error("Database Error:", error);
    return { error: "Failed to create contact. Email might already exist." };
  }
}

// ============================================================================
// MODULE 3: THE PIPELINE (OPPORTUNITIES)
// ============================================================================

const OpportunitySchema = z.object({
  contactId: z.string().min(1, "Client is required"),
  propertyId: z.string().min(1, "Property is required"),
  status: z.enum(["RESERVED", "ACTIVE", "AT_RISK", "CANCELLED", "COMPLETED"]),
  financingMethod: z.enum(["CASH", "MORTGAGE"]),
});

export async function addOpportunity(formData: FormData) {
  const rawData = {
    contactId: formData.get("contactId"),
    propertyId: formData.get("propertyId"),
    status: formData.get("status"),
    financingMethod: formData.get("financingMethod"),
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
          status: "RESERVED", 
          financingMethod: validatedData.data.financingMethod,
        },
      }),
      prisma.property.update({
        where: { id: validatedData.data.propertyId },
        data: { status: "RESERVED" }, 
      }),
      // ======================================================
      // THE WHALE FIX A: PULL THEM BACK TO "ACTIVE_BUYER"
      // ======================================================
      prisma.contact.update({
        where: { id: validatedData.data.contactId },
        data: { type: "ACTIVE_BUYER" }
      })
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

    if (newStatus === "CANCELLED") {
      await prisma.property.update({ where: { id: deal.propertyId }, data: { status: "AVAILABLE" } });
    } else if (deal.status === "CANCELLED" && newStatus !== "CANCELLED") {
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
    return { error: "Cannot delete deal." };
  }
}

// ============================================================================
// MODULE 4: REVENUE OPS (WATERFALL ENGINE + GUARDRAILS + AUTO-CLEAR)
// ============================================================================

const LedgerSchema = z.object({
  opportunityId: z.string().min(1, "Deal is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  type: z.enum(["INVOICE", "PAYMENT", "REFUND"]), 
  status: z.enum(["PENDING", "PAID"]),
  dueDate: z.string().optional(),
  reference: z.string().optional(),
});

export async function addLedgerEntry(formData: FormData) {
  const opportunityId = formData.get("opportunityId") as string;
  const rawAmount = Number(formData.get("amount"));
  const type = formData.get("type") as "INVOICE" | "PAYMENT" | "REFUND";
  const status = formData.get("status") as "PENDING" | "PAID";
  
  const dueDate = formData.get("dueDate") || undefined;
  const reference = formData.get("reference") || undefined;

  const rawData = { opportunityId, amount: rawAmount, type, status, dueDate, reference };
  const validatedData = LedgerSchema.safeParse(rawData);
  
  if (!validatedData.success) {
    return { error: "Validation failed. Check your inputs." };
  }

  try {
    // ------------------------------------------------------------------------
    // STRICT FINANCIAL GUARDRAILS
    // ------------------------------------------------------------------------
    const deal = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { property: true, contact: true } 
    });
    
    if (!deal) return { error: "Deal not found" };

    const allEntries = await prisma.ledgerEntry.findMany({ where: { opportunityId } });
    
    const totalPayments = allEntries.filter(e => e.type === "PAYMENT" && e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
    const totalRefunds = allEntries.filter(e => e.type === "REFUND" && e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
    const currentNetPaid = totalPayments - totalRefunds;

    const targetPrice = deal.financingMethod === "MORTGAGE" ? Number(deal.property.mortgagePrice) : Number(deal.property.cashPrice);
    const remainingBalance = targetPrice - currentNetPaid;

    if (type === "REFUND" && rawAmount > currentNetPaid) {
      return { error: `Strict Math Error: Client has only paid KSh ${currentNetPaid.toLocaleString()}. You cannot authorize a refund of KSh ${rawAmount.toLocaleString()}.` };
    }

    if (type === "PAYMENT") {
      const hasInvoices = allEntries.some(e => e.type === "INVOICE");
      if (!hasInvoices) {
        return { error: "Accounting Lock: You must generate a Payment Plan for this deal before the system can accept payments." };
      }
    }

    if (type === "PAYMENT" && rawAmount > remainingBalance) {
      return { error: `Overpayment Blocked: The remaining balance for this unit is KSh ${remainingBalance.toLocaleString()}. The system cannot accept a payment of KSh ${rawAmount.toLocaleString()}.` };
    }

    // ------------------------------------------------------------------------
    // SCENARIO 1: IT IS AN INVOICE OR A REFUND
    // ------------------------------------------------------------------------
    if (type === "INVOICE" || type === "REFUND") {
      await prisma.ledgerEntry.create({
        data: {
          opportunityId,
          type: type as any,
          amount: rawAmount,
          status: status as any,
          dueDate: dueDate ? new Date(dueDate) : null,
          paidDate: status === "PAID" ? new Date() : null,
          reference: reference || null,
        },
      });

      if (type === "REFUND" && status === "PAID") {
        const netCashAfterRefund = currentNetPaid - rawAmount;
        if (netCashAfterRefund <= 0) {
          await prisma.$transaction([
            prisma.opportunity.update({ where: { id: deal.id }, data: { status: "CANCELLED" } }),
            prisma.property.update({ where: { id: deal.propertyId }, data: { status: "AVAILABLE" } })
          ]);
        }
      }
    } 
    
    // ------------------------------------------------------------------------
    // SCENARIO 2: IT IS A PAYMENT (The "Flowing" Waterfall Engine)
    // ------------------------------------------------------------------------
    else if (type === "PAYMENT" && status === "PAID") {
      
      const newTotalPaid = currentNetPaid + rawAmount;

      // ======================================================================
      // 1. ADVANCED CASH FLOW TRACING WITH EXACT RATIOS
      // ======================================================================
      const sortedInvoices = allEntries
        .filter(e => e.type === "INVOICE")
        .sort((a, b) => (a.dueDate ? new Date(a.dueDate).getTime() : 0) - (b.dueDate ? new Date(b.dueDate).getTime() : 0));

      let startingCash = currentNetPaid;
      let endingCash = currentNetPaid + rawAmount;
      let runningTotal = 0;
      let touchedInvoices: string[] = [];

      for (const inv of sortedInvoices) {
        const invStart = runningTotal;
        const invAmount = Number(inv.amount);
        const invEnd = runningTotal + invAmount;

        // Did this payment "touch" this specific invoice bucket?
        if (endingCash > invStart && startingCash < invEnd) {
          const fullyCleared = endingCash >= invEnd;
          const refName = inv.reference || "Installment";

          if (fullyCleared) {
            touchedInvoices.push(`${refName} Cleared`);
          } else {
            // Calculate exactly how much is sitting in this bucket now
            const currentBucketFill = Math.min(Math.max(endingCash - invStart, 0), invAmount);
            touchedInvoices.push(`Partial ${refName} (${currentBucketFill.toLocaleString()} / ${invAmount.toLocaleString()})`);
          }
        }
        runningTotal = invEnd;
      }

      // Generate the Smart Reference String
      let smartReference = "Payment";
      if (newTotalPaid >= targetPrice) {
        smartReference = "Final Balance Cleared";
      } else if (touchedInvoices.length > 0) {
        const uniqueParts = Array.from(new Set(touchedInvoices));
        smartReference = uniqueParts.join(" + ");
      } else {
        smartReference = "Advance Payment";
      }

      // 2. Save the transaction with the perfect label
      await prisma.ledgerEntry.create({
        data: {
          opportunityId,
          type: "PAYMENT",
          amount: rawAmount,
          status: "PAID",
          paidDate: new Date(),
          reference: smartReference, 
        },
      });

      // ======================================================================
      // 3. AUTO-CLEAR PENDING INVOICES
      // ======================================================================
      const pendingInvoices = allEntries
        .filter(e => e.type === "INVOICE" && e.status === "PENDING")
        .sort((a, b) => (a.dueDate ? new Date(a.dueDate).getTime() : 0) - (b.dueDate ? new Date(b.dueDate).getTime() : 0));

      const currentlyClearedInvoices = allEntries
        .filter(e => e.type === "INVOICE" && e.status === "PAID")
        .reduce((s, e) => s + Number(e.amount), 0);
        
      let availableCashToClear = newTotalPaid - currentlyClearedInvoices;

      for (const inv of pendingInvoices) {
        if (availableCashToClear >= Number(inv.amount)) {
          await prisma.ledgerEntry.update({
            where: { id: inv.id },
            data: { status: "PAID", paidDate: new Date() }
          });
          availableCashToClear -= Number(inv.amount);
        }
      }

      // ======================================================================
      // 4. AUTO-UPGRADES & MULTI-PROPERTY WHALE LOGIC
      // ======================================================================
      const downPaymentInvoice = sortedInvoices.find(e => e.reference === "Down Payment");
      const requiredDeposit = downPaymentInvoice ? Number(downPaymentInvoice.amount) : 0;

      if (deal.contact.type === "LEAD" || deal.contact.type === "PAST_CLIENT") {
        await prisma.contact.update({ where: { id: deal.contactId }, data: { type: "ACTIVE_BUYER" } });
      }

      if (newTotalPaid >= requiredDeposit && newTotalPaid < targetPrice && deal.status === "RESERVED") {
        await prisma.opportunity.update({ where: { id: opportunityId }, data: { status: "ACTIVE" } });
      }

      if (newTotalPaid >= targetPrice) {
        // Mark this specific deal and property as completed/sold
        await prisma.$transaction([
          prisma.opportunity.update({ where: { id: opportunityId }, data: { status: "COMPLETED" } }),
          prisma.property.update({ where: { id: deal.propertyId }, data: { status: "SOLD" } })
        ]);

        // THE WHALE FIX B: Check if this client has ANY OTHER active properties
        const otherActiveDeals = await prisma.opportunity.count({
          where: { 
            contactId: deal.contactId, 
            status: { in: ["RESERVED", "ACTIVE", "AT_RISK"] },
            id: { not: opportunityId } // Ignore the one we just completed
          }
        });

        // Only move them to PAST_CLIENT if they have zero other active properties
        if (otherActiveDeals === 0) {
          await prisma.contact.update({ 
            where: { id: deal.contactId }, 
            data: { type: "PAST_CLIENT" } 
          });
        }
      }
    }

    revalidatePath("/ledger");
    revalidatePath("/opportunities");
    revalidatePath("/properties");
    revalidatePath("/contacts");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to log financial entry." };
  }
}

// ---> KEEPING THE PLAN GENERATOR EXACTLY AS IT WAS <---
export async function deleteLedgerEntry(entryId: string) {
  try {
    await prisma.ledgerEntry.delete({ where: { id: entryId } });
    revalidatePath("/ledger");
    revalidatePath("/opportunities"); 
    revalidatePath("/"); 
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to delete entry." };
  }
}

export async function generatePaymentPlan(formData: FormData) {
  const opportunityId = formData.get("opportunityId") as string;
  const totalAmount = Number(formData.get("totalAmount"));
  const deposit = Number(formData.get("deposit"));
  const months = Number(formData.get("months")); 
  const startDate = new Date(formData.get("startDate") as string);

  try {
    const deal = await prisma.opportunity.findUnique({
        where: { id: opportunityId }
    });

    if (!deal) return { error: "Deal not found." };

    const existingPlan = await prisma.ledgerEntry.findFirst({
      where: { opportunityId, type: "INVOICE" }
    });

    if (existingPlan) {
      return { error: "A payment plan already exists for this deal. You cannot generate multiple plans." };
    }

    if (deposit > 0) {
      await prisma.ledgerEntry.create({
        data: {
          opportunityId,
          type: "INVOICE",
          status: "PENDING",
          amount: deposit,
          dueDate: startDate,
          reference: "Down Payment",
        },
      });
    }

    const invoices = [];
    
    if (deal.financingMethod === "CASH" && months > 0) {
        const monthlyAmount = (totalAmount - deposit) / months;
        for (let i = 1; i <= months; i++) {
          const nextDate = new Date(startDate);
          nextDate.setMonth(startDate.getMonth() + i); 
    
          invoices.push({
            opportunityId,
            type: "INVOICE",
            status: "PENDING",
            amount: monthlyAmount,
            dueDate: nextDate,
            // ==========================================================
            // EXPLICIT INSTALLMENT NUMBERING
            // ==========================================================
            reference: `Installment ${i}`, 
          });
        }
    } else if (deal.financingMethod === "MORTGAGE") {
        const disbursementDate = new Date(startDate);
        disbursementDate.setDate(disbursementDate.getDate() + 90);

        invoices.push({
            opportunityId,
            type: "INVOICE",
            status: "PENDING",
            amount: (totalAmount - deposit),
            dueDate: disbursementDate,
            reference: `Mortgage Disbursement`,
          });
    }

    if (invoices.length > 0) {
        await prisma.ledgerEntry.createMany({ data: invoices as any });
    }

    revalidatePath("/ledger");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to generate plan." };
  }
}

// ============================================================================
// MODULE 5: GLOBAL SEARCH
// ============================================================================

export async function globalSearch(query: string) {
  if (!query || query.length < 2) return { contacts: [], properties: [], deals: [] };

  try {
    const [rawContacts, rawProperties, rawDeals] = await Promise.all([
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ]
        },
        take: 5
      }),
      
      prisma.property.findMany({
        where: {
          OR: [
            { unitNumber: { contains: query, mode: "insensitive" } },
            { project: { name: { contains: query, mode: "insensitive" } } },
          ]
        },
        include: { project: true },
        take: 5
      }),

      prisma.opportunity.findMany({
        where: {
          OR: [
            { contact: { firstName: { contains: query, mode: "insensitive" } } },
            { contact: { lastName: { contains: query, mode: "insensitive" } } },
            { property: { unitNumber: { contains: query, mode: "insensitive" } } },
          ]
        },
        include: { contact: true, property: true },
        take: 5
      })
    ]);

    const properties = rawProperties.map(p => ({
      ...p,
      cashPrice: Number(p.cashPrice),
      mortgagePrice: Number(p.mortgagePrice),
    }));

    const deals = rawDeals.map(d => ({
      ...d,
      property: {
        ...d.property,
        cashPrice: Number(d.property.cashPrice),
        mortgagePrice: Number(d.property.mortgagePrice),
      }
    }));

    return { contacts: rawContacts, properties, deals };
  } catch (error) {
    console.error("Search Error:", error);
    return { contacts: [], properties: [], deals: [] };
  }
}