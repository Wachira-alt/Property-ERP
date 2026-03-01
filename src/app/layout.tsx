import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalSearch } from "@/components/GlobalSearch"; // Import the search bar

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
          
          {/* Right Side Wrapper - Pushed right by 64 (16rem/256px) */}
          <div className="flex-1 ml-64 flex flex-col min-h-screen">
            
            {/* Top Command Header */}
            <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
              <GlobalSearch />
              
              {/* Profile Avatar Placeholder (For when we add Auth) */}
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 border border-blue-200">
                GM
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-8">
              {children}
            </main>
            
          </div>
        </div>
      </body>
    </html>
  );
}