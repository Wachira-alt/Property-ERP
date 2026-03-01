"use server";

import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function broadcastCampaign(formData: FormData) {
  const audience = formData.get("audience") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const files = formData.getAll("attachments");

  try {
    const contacts = await prisma.contact.findMany({
      where: { type: audience as any, isSubscribed: true },
      select: { id: true, email: true, firstName: true } 
    });

    if (contacts.length === 0) {
      return { error: "No active, subscribed contacts found." };
    }

    let emailAttachments = [];
    for (const file of files) {
      if (typeof file === 'object' && file !== null && 'arrayBuffer' in file) {
        const fileObj = file as File;
        const arrayBuffer = await fileObj.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        emailAttachments.push({
          filename: fileObj.name,
          content: buffer,
        });
      }
    }

    // 1. THE FIX: Create the Campaign FIRST to get its ID
    const campaign = await prisma.campaign.create({
      data: {
        subject,
        audience,
        sentCount: contacts.length,
      }
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sendPromises = contacts.map(contact => {
      const unsubscribeLink = `${appUrl}/api/unsubscribe?contactId=${contact.id}`;

      return resend.emails.send({
        from: "Property Pilot <onboarding@resend.dev>", 
        to: contact.email,
        subject: subject,
        attachments: emailAttachments,
        // 2. THE FIX: Stamp the email with the Campaign ID
        tags: [
          {
            name: "campaign_id",
            value: campaign.id
          }
        ],
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
            <h2 style="color: #0f172a;">Hi ${contact.firstName},</h2>
            <div style="line-height: 1.6; color: #334155;">${body}</div>
            <br/><br/>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center;">
              This email was sent to ${contact.email}.<br/>
              <a href="${unsubscribeLink}" style="color: #475569; text-decoration: underline;">Click here to unsubscribe</a><br/>
              Property Pilot ERP • Nairobi, Kenya
            </p>
          </div>
        `
      });
    });

    const results = await Promise.all(sendPromises);

    if (results[0].error) {
      return { error: results[0].error.message }; 
    }

    return { success: true, count: contacts.length };

  } catch (error: any) {
    console.error("Total System Crash:", error);
    return { error: error.message || "System failed to broadcast campaign." };
  }
}