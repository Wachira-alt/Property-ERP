import { getProjects } from "@/actions/inventory"
import { getSession } from "@/lib/auth"
import { canPerform } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { AddProjectModal } from "@/components/modals/AddProjectModal"
import { Building2 } from "lucide-react"
import { ProjectList } from "./_components/ProjectList"

export default async function ProjectsPage() {
  const session = await getSession()
  if (!session || !canPerform(session.role, "MANAGE_INVENTORY")) {
    redirect("/contacts")
  }

  const projects = await getProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3]">Projects</h1>
          <p className="text-sm text-[#7d8590] mt-0.5">
            Manage developments, unit types, and individual units
          </p>
        </div>
        <AddProjectModal />
      </div>

      {projects.length === 0 ? (
        <div className="border border-dashed border-[#30363d] rounded-lg py-16 text-center">
          <Building2 size={32} className="mx-auto text-[#484f58] mb-3" />
          <p className="text-sm font-medium text-[#e6edf3]">No projects yet</p>
          <p className="text-xs text-[#7d8590] mt-1">Create your first project to start adding units</p>
        </div>
      ) : (
        <ProjectList projects={projects} />
      )}
    </div>
  )
}