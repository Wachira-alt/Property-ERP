// @ts-nocheck
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Home } from "lucide-react"
import { InventoryList } from "./_components/InventoryList"

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ project?: string; status?: string }> }) {
  const session = await getSession()
  if (!session) redirect("/login")

  const params = await searchParams
  const selectedProject = params.project ?? "ALL"
  const selectedStatus = params.status ?? "ALL"

  // Fetch data structured for the expandable list
  const projects = await prisma.project.findMany({
    where: { 
      isActive: true,
      ...(selectedProject !== "ALL" && { id: selectedProject })
    },
    include: {
      unitTypes: {
        include: {
          units: {
            where: {
              ...(selectedStatus !== "ALL" && { status: selectedStatus as any }),
            },
            orderBy: { name: "asc" }
          }
        },
        orderBy: { name: "asc" }
      }
    },
    orderBy: { name: "asc" }
  })

  // Filter out project types that have no units after status filtering
  const filteredProjects = projects.filter(p => p.unitTypes.some(ut => ut.units.length > 0))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3]">Inventory</h1>
        <p className="text-sm text-[#7d8590] mt-0.5">Explore available units and project developments</p>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="border border-dashed border-[#30363d] rounded-lg py-20 text-center bg-[#161b22]/30">
          <Home size={32} className="mx-auto text-[#484f58] mb-3" />
          <p className="text-sm font-medium text-[#7d8590]">No units found matching these filters</p>
        </div>
      ) : (
        <InventoryList projects={filteredProjects as any} />
      )}
    </div>
  )
}