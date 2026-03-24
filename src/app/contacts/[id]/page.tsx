import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DocumentGallery } from "./DocumentGallery";
import { InitializeReservationForm } from "./InitializeReservationForm";
import { ManualLedgerBuilder } from "./ManualLedgerBuilder";
import { ClosingGate } from "./ClosingGate";
import { OfferLetterGenerator } from "./OfferLetterGenerator";
import { Clock, CheckCircle2, ShieldCheck, FileText } from "lucide-react";

export default async function ContactProfilePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id: id },
    include: {
      project: true,
      opportunities: {
        include: {
          unit: { include: { unitType: true } },
          ledgerEntries: { orderBy: { dueDate: "asc" } }
        }
      }
    }
  });

  if (!contact) notFound();

  const activeDealRaw = contact.opportunities[0];
  
  // --- CLEAN DATA FOR CLIENT COMPONENTS ---
  // This removes the Prisma 'Decimal' and 'Date' objects that crash React
  const activeDeal = activeDealRaw ? {
    ...activeDealRaw,
    agreedPrice: Number(activeDealRaw.agreedPrice),
    ledgerEntries: activeDealRaw.ledgerEntries.map(entry => ({
      ...entry,
      amount: Number(entry.amount),
      // Ensure dueDate is a simple string for the HTML date input
      dueDate: entry.dueDate.toISOString().split('T')[0] 
    }))
  } : null;

  const currentStage = activeDeal?.status || "LEAD";
  const unit = activeDeal?.unit;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      
      {/* 1. DYNAMIC PIPELINE HEADER */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                currentStage === 'LEAD' ? 'bg-emerald-500' : currentStage === 'RESERVED' ? 'bg-amber-400' : 'bg-blue-500'
              }`} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Terminal Access / Profile</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight italic leading-none">
              {contact.firstName} {contact.lastName}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-slate-800 px-5 py-3 rounded-2xl border border-slate-700">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Assigned Project</p>
              <p className="text-sm font-bold text-blue-400 uppercase">{contact.project?.name || "Unassigned"}</p>
            </div>
            {unit?.holdExpiresAt && (
              <div className="bg-amber-950/30 border border-amber-500/30 px-5 py-3 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Amber Lock Timer</p>
                <p className="text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {new Date(unit.holdExpiresAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4">
          {['GREEN (LEAD)', 'AMBER (RESERVED)', 'BLUE (CLOSED)'].map((label, idx) => {
            const isPast = (idx === 0) || (idx === 1 && currentStage !== 'LEAD') || (idx === 2 && currentStage === 'CLOSED');
            return (
              <div key={label} className="space-y-3">
                <div className={`h-1.5 rounded-full transition-all duration-1000 ${isPast ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} />
                <p className={`text-[9px] font-black uppercase tracking-widest ${isPast ? 'text-white' : 'text-slate-600'}`}>{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <DocumentGallery contact={contact} stage={currentStage} />
          {currentStage === "RESERVED" && activeDeal && (
            <ClosingGate 
              contactId={contact.id} 
              unitId={unit!.id} 
              opportunityId={activeDeal.id}
              isDocsReady={!!(contact.idDocumentUrl && contact.kraDocumentUrl && contact.signedOfferUrl && contact.bookingFeeUrl)}
            />
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2 px-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Execution</h3>
          </div>

          {currentStage === "LEAD" ? (
            <div className="bg-white p-16 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">Lead Registered</h4>
              <p className="text-slate-500 text-sm max-w-xs mb-8">
                Initialize the reservation to begin financial modeling.
              </p>
              <InitializeReservationForm contactId={contact.id} unitId={contact.interestedUnitId} />
            </div>
          ) : activeDeal && (
            <div className="space-y-8">
              <ManualLedgerBuilder 
                opportunityId={activeDeal.id} 
                contactId={contact.id} 
                entries={activeDeal.ledgerEntries} 
                agreedPrice={activeDeal.agreedPrice}
              />
              <OfferLetterGenerator 
                contact={contact}
                opportunity={activeDeal}
                ledgerEntries={activeDeal.ledgerEntries}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}