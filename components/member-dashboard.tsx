"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import type { Task } from "@/lib/types"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface MemberDashboardProps {
  userId: string
}

export function MemberDashboard({ userId }: MemberDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTasks()
  }, [userId])

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*, projects(name)")
      .eq("assigned_to", userId)
      .order("due_date", { ascending: true })

    if (data) setTasks(data)
    setLoading(false)
  }

  const notStartedTasks = tasks.filter(t => t.status === "not_started")
  const inProgressTasks = tasks.filter(t => t.status === "in_progress")
  const pendingReviewTasks = tasks.filter(t => t.status === "pending_review")
  const completedTasks = tasks.filter(t => t.status === "verified_completed")
  const needsReworkTasks = tasks.filter(t => t.status === "needs_rework")
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date) return false
    return new Date(t.due_date) < new Date() && t.status !== "verified_completed"
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started": return "bg-slate-100 text-slate-700"
      case "in_progress": return "bg-blue-100 text-blue-700"
      case "pending_review": return "bg-amber-100 text-amber-700"
      case "verified_completed": return "bg-green-100 text-green-700"
      case "needs_rework": return "bg-red-100 text-red-700"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500"
      case "medium": return "bg-amber-500"
      case "low": return "bg-green-500"
      default: return "bg-slate-500"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {needsReworkTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Tasks Needing Rework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsReworkTasks.map((task) => (
                <div key={task.id} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.projects?.name}</p>
                    </div>
                    <Link href="/dashboard/my-tasks">
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </div>
                  {task.admin_feedback && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                      <strong>Feedback:</strong> {task.admin_feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Tasks</CardTitle>
          <Link href="/dashboard/my-tasks">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No tasks assigned to you
            </div>
          ) : (
            <div className="space-y-3">
              {tasks
                .filter(t => t.status !== "verified_completed")
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.projects?.name} {task.due_date && `- Due: ${format(new Date(task.due_date), "MMM d")}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                      {task.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
