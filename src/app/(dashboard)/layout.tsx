// @ts-nocheck
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { SessionProvider } from "@/components/shared/SessionProvider"
import { Sidebar } from "@/components/shared/Sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  return (
    <SessionProvider user={user}>
      <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
        <Sidebar user={user} />
        <main className="md:pl-[240px] min-h-screen">
          <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}