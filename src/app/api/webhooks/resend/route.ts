// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // 1. Find the hidden tag we stamped on the email
    const tags = data?.tags || [];
    const campaignTag = tags.find((t: any) => t.name === "campaign_id");

    if (!campaignTag) {
      return NextResponse.json({ message: "Not a campaign email, ignoring." });
    }

    const campaignId = campaignTag.value;

    // 2. Update the database based on what the client did
    if (type === "email.opened") {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { openCount: { increment: 1 } }
      });
      console.log(`[Analytics] Someone opened campaign: ${campaignId}`);
    } 
    
    else if (type === "email.clicked") {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { clickCount: { increment: 1 } }
      });
      console.log(`[Analytics] Someone clicked a link in campaign: ${campaignId}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}