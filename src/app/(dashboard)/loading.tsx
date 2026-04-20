export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-[1280px]">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-[#21262d] rounded-md animate-pulse" />
        <div className="h-4 w-72 bg-[#21262d] rounded-md animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-full bg-[#21262d] rounded-lg animate-pulse" />
        <div className="h-10 w-full bg-[#21262d] rounded-lg animate-pulse" />
        <div className="h-10 w-full bg-[#21262d] rounded-lg animate-pulse" />
        <div className="h-10 w-full bg-[#21262d] rounded-lg animate-pulse" />
        <div className="h-10 w-3/4 bg-[#21262d] rounded-lg animate-pulse" />
      </div>
    </div>
  )
}