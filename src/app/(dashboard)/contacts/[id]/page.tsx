// src/app/contacts/[id]/page.tsx
import prisma from "@/lib/prisma";
import { DocumentGallery } from "./DocumentGallery";
import { ClosingGate } from "./ClosingGate";
import { notFound } from "next/navigation";

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  // Fetch with explicit includes to avoid 'undefined' errors
  const opportunity = await prisma.opportunity.findFirst({
    where: { contactId: id },
    include: { 
      contact: true, 
      unit: true,
      ledgerEntries: true 
    }
  });

  if (!opportunity) return notFound();

  /**
   * SERIALIZATION FIX: 
   * Prisma Decimal objects and Dates cannot be passed to Client Components.
   * Stringifying and re-parsing converts them to plain strings/numbers.
   */
  const serializedOpportunity = JSON.parse(JSON.stringify(opportunity));

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <section>
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 px-2">
          Document Verification Vault
        </h2>
        <DocumentGallery 
          contact={serializedOpportunity.contact} 
          opportunityStatus={serializedOpportunity.status} 
        />
      </section>

      <section>
        <ClosingGate opportunity={serializedOpportunity} />
      </section>
    </div>
  );
}