import { prisma } from "@/lib/prisma";
import { Megaphone, Users, Target, Crown } from "lucide-react";
import { CampaignBuilder } from "./CampaignBuilder";
import { CampaignHistory } from "./CampaignHistory"; // <-- Added this import

export default async function MarketingPage() {
  // 1. Fetch exact audience sizes based on our automated tags
  const [leads, activeBuyers, pastClients] = await Promise.all([
    prisma.contact.count({ where: { type: "LEAD" } }),
    prisma.contact.count({ where: { type: "ACTIVE_BUYER" } }),
    prisma.contact.count({ where: { type: "PAST_CLIENT" } }),
  ]);

  const audienceStats = { leads, activeBuyers, pastClients };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Marketing Hub</h1>
        <p className="text-slate-500 mt-1">Design and broadcast targeted campaigns to your segmented audiences.</p>
      </div>

      {/* AUDIENCE INTELLIGENCE CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* Leads Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cold Leads</p>
            <h2 className="text-2xl font-bold text-slate-900">{leads} People</h2>
            <p className="text-xs text-blue-600 font-medium mt-1">Target: Project Launches & Promos</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Active Buyers Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Buyers</p>
            <h2 className="text-2xl font-bold text-slate-900">{activeBuyers} People</h2>
            <p className="text-xs text-emerald-600 font-medium mt-1">Target: Construction Updates</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Past Clients Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Past Clients (Whales)</p>
            <h2 className="text-2xl font-bold text-slate-900">{pastClients} People</h2>
            <p className="text-xs text-amber-600 font-medium mt-1">Target: VIP Referrals & Upsells</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* THE INTERACTIVE BUILDER */}
      <CampaignBuilder stats={audienceStats} />

      {/* THE NEW ANALYTICS TABLE */}
      <CampaignHistory />
    </div>
  );
}