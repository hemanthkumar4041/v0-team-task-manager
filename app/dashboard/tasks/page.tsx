"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Loader2, MessageSquare } from "lucide-react"
import type { Task, Project, Profile } from "@/lib/types"
import { format } from "date-fns"

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [reviewFeedback, setReviewFeedback] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    assigned_to: "",
    due_date: "",
    priority: "medium" as Task["priority"],
    status: "not_started" as Task["status"],
  })
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [tasksRes, projectsRes, membersRes] = await Promise.all([
      supabase.from("tasks").select("*, profiles(full_name), projects(name)").order("created_at", { ascending: false }),
      supabase.from("projects").select("*"),
      supabase.from("profiles").select("*").eq("role", "member"),
    ])

    if (tasksRes.data) setTasks(tasksRes.data)
    if (projectsRes.data) setProjects(projectsRes.data)
    if (membersRes.data) setMembers(membersRes.data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const taskData = {
      ...formData,
      project_id: formData.project_id || null,
      assigned_to: formData.assigned_to || null,
      due_date: formData.due_date || null,
    }

    if (selectedTask) {
      await supabase.from("tasks").update(taskData).eq("id", selectedTask.id)
      await supabase.from("activity_logs").insert({
        user_id: user?.id,
        action: `updated task "${formData.title}"`,
        entity_type: "task",
        entity_id: selectedTask.id,
      })
    } else {
      const { data: newTask } = await supabase
        .from("tasks")
        .insert({ ...taskData, created_by: user?.id })
        .select()
        .single()

      if (newTask) {
        await supabase.from("activity_logs").insert({
          user_id: user?.id,
          action: `created task "${formData.title}"`,
          entity_type: "task",
          entity_id: newTask.id,
        })

        if (formData.assigned_to) {
          await supabase.from("notifications").insert({
            user_id: formData.assigned_to,
            title: "New Task Assigned",
            message: `You have been assigned to task "${formData.title}"`,
          })
        }
      }
    }

    setSaving(false)
    setDialogOpen(false)
    resetForm()
    fetchData()
  }

  const handleDelete = async (task: Task) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("tasks").delete().eq("id", task.id)
    await supabase.from("activity_logs").insert({
      user_id: user?.id,
      action: `deleted task "${task.title}"`,
      entity_type: "task",
      entity_id: task.id,
    })

    fetchData()
  }

  const handleReview = async (approved: boolean) => {
    if (!selectedTask) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const newStatus = approved ? "verified_completed" : "needs_rework"
    await supabase
      .from("tasks")
      .update({ status: newStatus, admin_feedback: reviewFeedback || null })
      .eq("id", selectedTask.id)

    await supabase.from("task_reviews").insert({
      task_id: selectedTask.id,
      reviewer_id: user?.id,
      status: approved ? "approved" : "rework_requested",
      comments: reviewFeedback || null,
    })

    await supabase.from("activity_logs").insert({
      user_id: user?.id,
      action: approved ? `approved task "${selectedTask.title}"` : `requested rework for "${selectedTask.title}"`,
      entity_type: "task",
      entity_id: selectedTask.id,
    })

    if (selectedTask.assigned_to) {
      await supabase.from("notifications").insert({
        user_id: selectedTask.assigned_to,
        title: approved ? "Task Approved" : "Task Needs Rework",
        message: approved
          ? `Your task "${selectedTask.title}" has been approved!`
          : `Your task "${selectedTask.title}" needs rework. ${reviewFeedback}`,
      })
    }

    setSaving(false)
    setReviewDialogOpen(false)
    setReviewFeedback("")
    setSelectedTask(null)
    fetchData()
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      project_id: "",
      assigned_to: "",
      due_date: "",
      priority: "medium",
      status: "not_started",
    })
    setSelectedTask(null)
  }

  const openEditDialog = (task: Task) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      project_id: task.project_id || "",
      assigned_to: task.assigned_to || "",
      due_date: task.due_date || "",
      priority: task.priority,
      status: task.status,
    })
    setDialogOpen(true)
  }

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
      case "high": return "bg-red-100 text-red-700"
      case "medium": return "bg-amber-100 text-amber-700"
      case "low": return "bg-green-100 text-green-700"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    if (filterProject !== "all" && task.project_id !== filterProject) return false
    return true
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">All Tasks</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="verified_completed">Completed</SelectItem>
              <SelectItem value="needs_rework">Needs Rework</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedTask ? "Edit Task" : "Create New Task"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Project</Label>
                    <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Assign To</Label>
                    <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: Task["priority"]) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: Task["status"]) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                        <SelectItem value="verified_completed">Completed</SelectItem>
                        <SelectItem value="needs_rework">Needs Rework</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {selectedTask ? "Update Task" : "Create Task"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No tasks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.projects?.name || "-"}</TableCell>
                      <TableCell>{task.profiles?.full_name || "Unassigned"}</TableCell>
                      <TableCell>{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "-"}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                          {task.status.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {task.status === "pending_review" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => { setSelectedTask(task); setReviewDialogOpen(true) }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(task)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(task)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Task: {selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask?.member_comments && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-700">Member Comments:</p>
                <p className="text-sm">{selectedTask.member_comments}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (optional)</Label>
              <Textarea
                id="feedback"
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Enter feedback for the team member..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleReview(true)} className="flex-1 bg-green-600 hover:bg-green-700" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Approve
              </Button>
              <Button onClick={() => handleReview(false)} variant="destructive" className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Request Rework
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
