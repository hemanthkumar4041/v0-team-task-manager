"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Profile, Task } from "@/lib/types"
import { format } from "date-fns"

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [membersRes, tasksRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*"),
    ])

    if (membersRes.data) setMembers(membersRes.data)
    if (tasksRes.data) setTasks(tasksRes.data)
    setLoading(false)
  }

  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter((t) => t.assigned_to === memberId)
    return {
      total: memberTasks.length,
      completed: memberTasks.filter((t) => t.status === "verified_completed").length,
      inProgress: memberTasks.filter((t) => t.status === "in_progress").length,
      pendingReview: memberTasks.filter((t) => t.status === "pending_review").length,
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Team Members</h2>

      <Card>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No team members yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Total Tasks</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>In Progress</TableHead>
                    <TableHead>Pending Review</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const stats = getMemberStats(member.id)
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                              {member.full_name.charAt(0)}
                            </div>
                            <span className="font-medium">{member.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded ${member.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            {member.role}
                          </span>
                        </TableCell>
                        <TableCell>{stats.total}</TableCell>
                        <TableCell>
                          <span className="text-green-600">{stats.completed}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-600">{stats.inProgress}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-amber-600">{stats.pendingReview}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(member.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.filter(m => m.role === "member").map((member) => {
          const stats = getMemberStats(member.id)
          const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
          return (
            <Card key={member.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-lg font-medium">
                    {member.full_name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{member.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-lg font-bold text-blue-600">{stats.inProgress}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-lg font-bold text-amber-600">{stats.pendingReview}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-lg font-bold text-green-600">{stats.completed}</p>
                      <p className="text-xs text-muted-foreground">Done</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
