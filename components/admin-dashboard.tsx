"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, CheckSquare, Users, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import type { Task, Project, Profile, ActivityLog } from "@/lib/types"
import { format } from "date-fns"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface AdminDashboardProps {
  userId: string
}

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [projectsRes, tasksRes, membersRes, activitiesRes] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("tasks").select("*, profiles(full_name)"),
      supabase.from("profiles").select("*"),
      supabase.from("activity_logs").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
    ])

    if (projectsRes.data) setProjects(projectsRes.data)
    if (tasksRes.data) setTasks(tasksRes.data)
    if (membersRes.data) setMembers(membersRes.data)
    if (activitiesRes.data) setActivities(activitiesRes.data)
    setLoading(false)
  }

  const pendingReviewTasks = tasks.filter(t => t.status === "pending_review")
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date) return false
    return new Date(t.due_date) < new Date() && t.status !== "verified_completed"
  })
  const completedTasks = tasks.filter(t => t.status === "verified_completed")
  const inProgressTasks = tasks.filter(t => t.status === "in_progress")

  const taskStatusData = [
    { name: "Not Started", value: tasks.filter(t => t.status === "not_started").length, color: "#94a3b8" },
    { name: "In Progress", value: inProgressTasks.length, color: "#3b82f6" },
    { name: "Pending Review", value: pendingReviewTasks.length, color: "#f59e0b" },
    { name: "Completed", value: completedTasks.length, color: "#22c55e" },
    { name: "Needs Rework", value: tasks.filter(t => t.status === "needs_rework").length, color: "#ef4444" },
  ].filter(d => d.value > 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviewTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No tasks yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingReviewTasks.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No tasks pending review
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviewTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Assigned to: {task.profiles?.full_name || "Unassigned"}
                      </p>
                    </div>
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                      Pending Review
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                No overdue tasks
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-red-600">
                        Due: {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No date"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No recent activity
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 border-b last:border-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium">
                      {activity.profiles?.full_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.profiles?.full_name}</span>{" "}
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
