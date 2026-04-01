import { redirect }          from "next/navigation"
import { getSession }        from "@/lib/auth"
import { canPerform }        from "@/lib/permissions"
import { getCampaigns }      from "@/actions/marketing"
import { CampaignBuilder }   from "./_components/CampaignBuilder"
import { CampaignHistory }   from "./_components/CampaignHistory"

export default async function MarketingPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!canPerform(session.role, "SEND_CAMPAIGN")) redirect("/contacts")

  const campaigns = await getCampaigns()

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Marketing</h1>
        <p className="text-sm text-[#7d8590] mt-0.5">
          Send targeted messages to contact segments
        </p>
      </div>

      {/* Campaign builder */}
      <CampaignBuilder />

      {/* Campaign history */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-[#e6edf3]">
          Campaign history
          <span className="ml-2 text-[#484f58] font-normal text-xs">
            {campaigns.length} total
          </span>
        </h2>
        <CampaignHistory campaigns={campaigns} />
      </div>
    </div>
  )
}