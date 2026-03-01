import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    // 1. Find UPCOMING invoices (Due in exactly 3 days)
    const upcomingInvoices = await prisma.ledgerEntry.findMany({
      where: {
        type: "INVOICE",
        status: "PENDING",
        dueDate: {
          gte: threeDaysFromNow,
          lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000), // Next day
        },
      },
      include: { opportunity: { include: { contact: true, property: true } } },
    });

    // 2. Find OVERDUE invoices (Due before today)
    const overdueInvoices = await prisma.ledgerEntry.findMany({
      where: {
        type: "INVOICE",
        status: "PENDING",
        dueDate: {
          lt: today,
        },
      },
      include: { opportunity: { include: { contact: true, property: true } } },
    });

    // 3. Process UPCOMING Emails
    const upcomingEmails = upcomingInvoices.map(invoice => {
      const client = invoice.opportunity.contact;
      const unit = invoice.opportunity.property.unitNumber;
      return {
        to: client.email,
        subject: `Upcoming Payment Reminder: Unit ${unit}`,
        message: `Hi ${client.firstName}, just a friendly reminder that your payment of $${Number(invoice.amount).toLocaleString()} for Unit ${unit} is due on ${invoice.dueDate?.toLocaleDateString()}.`
      };
    });

    // 4. Process OVERDUE Emails
    const overdueEmails = overdueInvoices.map(invoice => {
      const client = invoice.opportunity.contact;
      const unit = invoice.opportunity.property.unitNumber;
      return {
        to: client.email,
        subject: `URGENT: Overdue Payment for Unit ${unit}`,
        message: `Dear ${client.firstName}, your payment of $${Number(invoice.amount).toLocaleString()} for Unit ${unit} was due on ${invoice.dueDate?.toLocaleDateString()} and is now overdue. Please remit payment immediately.`
      };
    });

    // NOTE: In production, we would hook this up to SendGrid or Resend to actually blast the emails.
    // For now, we will log them to your server console to prove the engine is working perfectly.
    console.log("\n=====================================");
    console.log("🤖 DUNNING ENGINE EXECUTED");
    console.log("=====================================");
    console.log(`Upcoming Emails Queued: ${upcomingEmails.length}`);
    console.log(`Overdue Emails Queued: ${overdueEmails.length}`);
    
    if (upcomingEmails.length > 0) console.log("\nUPCOMING:", upcomingEmails);
    if (overdueEmails.length > 0) console.log("\nOVERDUE:", overdueEmails);
    console.log("=====================================\n");

    return NextResponse.json({
      success: true,
      message: "Dunning engine completed successfully.",
      upcomingCount: upcomingEmails.length,
      overdueCount: overdueEmails.length,
    });

  } catch (error) {
    console.error("Dunning Engine Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}