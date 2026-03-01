import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. Grab the unique contact ID from the URL link they clicked
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");

  if (!contactId) {
    return new NextResponse("Invalid or missing unsubscribe link.", { status: 400 });
  }

  try {
    // 2. Flip their subscription status in the database
    await prisma.contact.update({
      where: { id: contactId },
      data: { isSubscribed: false },
    });

    // 3. Show them a clean, professional success screen
    return new NextResponse(`
      <html>
        <body style="font-family: system-ui, sans-serif; background-color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px;">
            <svg style="width: 48px; height: 48px; color: #16a34a; margin: 0 auto 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 style="margin: 0 0 8px; color: #0f172a;">Unsubscribed Successfully</h2>
            <p style="margin: 0; color: #64748b; line-height: 1.5;">You have been removed from this mailing list and will no longer receive marketing emails from Property Pilot.</p>
          </div>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });

  } catch (error) {
    console.error("Unsubscribe Error:", error);
    return new NextResponse("Failed to process unsubscribe request. Please contact support.", { status: 500 });
  }
}