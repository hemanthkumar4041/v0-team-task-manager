"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  ClipboardList,
} from "lucide-react"

interface DashboardSidebarProps {
  profile: Profile
}

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const isAdmin = profile.role === "admin"

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
    { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/dashboard/members", label: "Team Members", icon: Users },
    { href: "/dashboard/activity", label: "Activity Log", icon: Activity },
  ]

  const memberLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/my-tasks", label: "My Tasks", icon: CheckSquare },
    { href: "/dashboard/activity", label: "Activity Log", icon: Activity },
  ]

  const links = isAdmin ? adminLinks : memberLinks

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white hidden lg:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="bg-blue-600 p-2 rounded-lg">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-lg">Task Manager</span>
      </div>
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-slate-100 rounded-lg p-3">
          <p className="text-xs text-slate-500">Logged in as</p>
          <p className="text-sm font-medium truncate">{profile.full_name}</p>
          <p className="text-xs text-blue-600 capitalize">{profile.role}</p>
        </div>
      </div>
    </aside>
  )
}
