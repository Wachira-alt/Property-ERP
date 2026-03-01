"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, ReceiptText } from "lucide-react";
import { PaymentReceipt } from "./PaymentReceipt";

export function DownloadReceiptBtn({ client, entry }: { client: any; entry: any }) {
  return (
    <PDFDownloadLink
      document={<PaymentReceipt client={client} entry={entry} />}
      fileName={`${entry.type}_${entry.id.substring(0,8)}.pdf`}
      className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md inline-flex items-center justify-center transition-colors"
      title={`Download ${entry.type}`}
    >
      {/* @ts-ignore */}
      {({ loading }) => (loading ? <Download className="w-4 h-4 animate-pulse" /> : <ReceiptText className="w-4 h-4" />)}
    </PDFDownloadLink>
  );
}