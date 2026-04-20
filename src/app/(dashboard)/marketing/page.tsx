// @ts-nocheck
import { redirect }        from "next/navigation"
import { getSession }      from "@/lib/auth"
import { canPerform }      from "@/lib/permissions"
import { getCampaigns }    from "@/actions/marketing"
import { MarketingShell }  from "./_components/MarketingShell"

export default async function MarketingPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!canPerform(session.role, "SEND_CAMPAIGN")) redirect("/contacts")

  const campaigns = await getCampaigns()

  const totalSent       = campaigns.filter((c) => c.sentAt).length
  const totalRecipients = campaigns.reduce((s, c) => s + c.sentCount, 0)
  const canDelete       = ["ADMIN", "GENERAL_MANAGER"].includes(session.role)

  return (
    <MarketingShell
      campaigns={campaigns}
      canDelete={canDelete}
      stats={{ totalSent, totalRecipients, totalDrafts: campaigns.length - totalSent }}
    />
  )
}