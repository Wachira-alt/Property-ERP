"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { StatementPDF } from "./StatementPDF";

// Only load the PDF engine on the client side
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

export function DownloadStatementBtn({ client, items }: { client: any; items: any[] }) {
  return (
    <div className="w-full">
      <PDFDownloadLink
        document={<StatementPDF client={client} entries={items} />}
        fileName={`Statement_${client.name.replace(/\s+/g, "_")}.pdf`}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
      >
        {/* @ts-ignore */}
        {({ loading }) =>
          loading ? (
            "Generating..."
          ) : (
            <>
              <Download className="w-4 h-4" /> Download Statement
            </>
          )
        }
      </PDFDownloadLink>
    </div>
  );
}