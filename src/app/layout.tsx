import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar"; // Import the sidebar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Property ERP",
  description: "Real Estate Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-slate-50">
          {/* Permanent Sidebar */}
          <Sidebar />
          
          {/* Main Content Area - Pushed right by 64 (16rem/256px) */}
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}