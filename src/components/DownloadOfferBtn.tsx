"use client";

import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import { OfferLetter } from "./pdf/OfferLetter"; 

// This prevents the PDF engine from crashing the server
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

export function DownloadOfferBtn({ deal }: { deal: any }) {
  return (
    <PDFDownloadLink
      document={<OfferLetter deal={deal} />}
      fileName={`Offer_Letter_${deal.property.unitNumber}.pdf`}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
    >
      {/* @ts-ignore */}
      {({ loading }) => (loading ? "..." : <><FileText className="w-3 h-4" /> Offer Letter</>)}
    </PDFDownloadLink>
  );
}