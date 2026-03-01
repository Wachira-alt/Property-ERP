import { prisma } from "@/lib/prisma";
import { Send } from "lucide-react";

export async function CampaignHistory() {
  // Fetch the 10 most recent campaigns from the database
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (campaigns.length === 0) {
    return (
      <div className="mt-12 bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
        No campaigns sent yet. Your broadcast history will appear here.
      </div>
    );
  }

  return (
    <div className="mt-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" /> Past Campaigns & Analytics
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Campaign Subject</th>
              <th className="px-6 py-4">Target Audience</th>
              <th className="px-6 py-4">Date Sent</th>
              <th className="px-6 py-4 text-center">Delivered</th>
              <th className="px-6 py-4 text-center">Opens</th>
              <th className="px-6 py-4 text-center">Clicks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((campaign) => {
              // Calculate the Open Rate percentage safely
              const openRate = campaign.sentCount > 0 
                ? Math.round((campaign.openCount / campaign.sentCount) * 100) 
                : 0;

              return (
                <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {campaign.subject}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide">
                      {campaign.audience.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(campaign.createdAt).toLocaleDateString("en-US", { 
                      month: "short", day: "numeric", year: "numeric" 
                    })}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-700">
                    {campaign.sentCount}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-slate-900">{campaign.openCount}</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-1">
                        {openRate}% Rate
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900">
                    {campaign.clickCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}