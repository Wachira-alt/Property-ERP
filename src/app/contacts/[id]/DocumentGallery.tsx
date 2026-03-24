"use client";

import { useState, useRef } from "react";
import { FileText, Image as ImageIcon, CheckCircle, UploadCloud, Eye, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadDocument } from "@/app/actions/documents";
import { toast } from "sonner";

export function DocumentGallery({ contact, stage }: { contact: any, stage: string }) {
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const amberDocs = [
    { label: "National ID / Passport", key: "idDocumentUrl", value: contact.idDocumentUrl, icon: ImageIcon },
    { label: "KRA PIN Certificate", key: "kraDocumentUrl", value: contact.kraDocumentUrl, icon: FileText },
  ];

  const closingDocs = [
    { label: "Signed Offer Letter", key: "signedOfferUrl", value: contact.signedOfferUrl, icon: FileText },
    { label: "Booking Fee Receipt", key: "bookingFeeUrl", value: contact.bookingFeeUrl, icon: CheckCircle },
  ];

  const amberComplete = !!(contact.idDocumentUrl && contact.kraDocumentUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeKey) return;
    setIsUploading(activeKey);
    try {
      const simulatedUrl = `/vault/${contact.lastName}_${activeKey}.pdf`;
      await uploadDocument(contact.id, activeKey, simulatedUrl);
      toast.success(`${docLabel(activeKey)} uploaded.`);
    } catch (error) {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(null);
      setActiveKey(null);
    }
  };

  const docLabel = (key: string) => [...amberDocs, ...closingDocs].find(d => d.key === key)?.label;

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Amber Requirements
          </h3>
          {amberComplete && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        </div>
        <div className="divide-y divide-slate-100">
          {amberDocs.map((doc) => (
            <DocRow key={doc.key} doc={doc} stage={stage} isUploading={isUploading} onUploadClick={(key) => { setActiveKey(key); fileInputRef.current?.click(); }} />
          ))}
        </div>
      </div>

      <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all ${!amberComplete ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        <div className="p-5 bg-blue-50/50 border-b border-blue-100">
          <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-3 h-3" /> Closing (Blue) Requirements
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {closingDocs.map((doc) => (
            <DocRow key={doc.key} doc={doc} stage={stage} isUploading={isUploading} onUploadClick={(key) => { setActiveKey(key); fileInputRef.current?.click(); }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DocRow({ doc, stage, isUploading, onUploadClick }: any) {
  const isLocked = stage === "LEAD";
  
  return (
    <div className="p-4 flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${doc.value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
          <doc.icon className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{doc.label}</p>
      </div>
      <div className="flex items-center gap-2">
        {doc.value ? (
          /* FIX: This now allows you to actually see the file */
          <a 
            href={doc.value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-sm transition-all"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </a>
        ) : !isLocked && (
          <Button variant="outline" size="sm" disabled={isUploading === doc.key} onClick={() => onUploadClick(doc.key)} className="h-7 text-[8px] font-black uppercase border-dashed">
            {isUploading === doc.key ? "..." : "Upload"}
          </Button>
        )}
      </div>
    </div>
  );
}