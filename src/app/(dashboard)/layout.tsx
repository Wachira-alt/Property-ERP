// @ts-nocheck
import { redirect }        from "next/navigation"
import { getSession }      from "@/lib/auth"
import { SessionProvider } from "@/components/shared/SessionProvider"
import { Sidebar }         from "@/components/shared/Sidebar"
import { PullToRefresh }   from "@/components/shared/PullToRefresh"
import { AutoRefresh }     from "./AutoRefresh"

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
      <AutoRefresh />
      <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
        <Sidebar user={user} />

        {/*
          Desktop: pad left for sidebar (240px), no top padding needed
          Mobile:  pad top for status bar, pad bottom for tab bar + home indicator
        */}
        <main
          className="md:pl-[240px] min-h-screen pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <PullToRefresh>
            <div className="max-w-[1280px] mx-auto px-4 py-6 md:px-6">
              {children}
            </div>
          </PullToRefresh>
        </main>
      </div>
    </SessionProvider>
  )
}