// src/app/contacts/[id]/DocumentGallery.tsx
"use client";

import { CheckCircle2, FileText, UploadCloud, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateContactDocuments } from "@/app/actions/documents";
import { toast } from "sonner";

export function DocumentGallery({ contact, opportunityStatus }: { contact: any, opportunityStatus: string }) {
  const isClosed = opportunityStatus === "CLOSED";

  const docSlots = [
    { id: "idDocumentUrl", label: "National ID / Passport", url: contact.idDocumentUrl, category: "KYC (Amber)" },
    { id: "kraDocumentUrl", label: "KRA PIN Certificate", url: contact.kraDocumentUrl, category: "KYC (Amber)" },
    { id: "signedOfferUrl", label: "Signed Offer Letter", url: contact.signedOfferUrl, category: "Legal (Closed)" },
    { id: "bookingFeeUrl", label: "Booking Fee Receipt", url: contact.bookingFeeUrl, category: "Finance (Closed)" },
  ];

  const handleUpload = async (field: string) => {
    const mockUrl = `https://utfs.io/f/dev-${field}.pdf`; 
    try {
      await updateContactDocuments(contact.id, { [field]: mockUrl });
      toast.success("Document updated successfully.");
    } catch (e) {
      toast.error("Failed to update document.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {docSlots.map((doc) => (
        <Card key={doc.id} className={`p-5 border-2 transition-all ${doc.url ? 'border-emerald-200 bg-emerald-50/20' : 'border-dashed border-slate-200'}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">{doc.category}</p>
              <h4 className="text-sm font-bold text-slate-900">{doc.label}</h4>
            </div>
            {doc.url ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-slate-200" />}
          </div>
          <div className="mt-6 flex gap-2">
            {doc.url ? (
              <Button variant="outline" size="sm" className="w-full text-[10px] font-black" asChild>
                <a href={doc.url} target="_blank" rel="noreferrer"><Eye className="w-3 h-3 mr-2" /> View File</a>
              </Button>
            ) : !isClosed && (
              <Button onClick={() => handleUpload(doc.id)} variant="secondary" size="sm" className="w-full text-[10px] font-black bg-slate-900 text-white hover:bg-blue-600">
                <UploadCloud className="w-3 h-3 mr-2" /> Upload
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}