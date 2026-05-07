"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Send, AlertTriangle, MessageSquare } from "lucide-react"
import type { Task, ProgressNote } from "@/lib/types"
import { format } from "date-fns"

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [progressNotes, setProgressNotes] = useState<Record<string, ProgressNote[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [memberComments, setMemberComments] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [tasksRes, notesRes] = await Promise.all([
      supabase.from("tasks").select("*, projects(name)").eq("assigned_to", user.id).order("due_date", { ascending: true }),
      supabase.from("progress_notes").select("*, profiles(full_name)").order("created_at", { ascending: false }),
    ])

    if (tasksRes.data) setTasks(tasksRes.data)
    
    if (notesRes.data) {
      const notesMap: Record<string, ProgressNote[]> = {}
      notesRes.data.forEach((note: ProgressNote) => {
        if (!notesMap[note.task_id]) notesMap[note.task_id] = []
        notesMap[note.task_id].push(note)
      })
      setProgressNotes(notesMap)
    }
    setLoading(false)
  }

  const handleStatusUpdate = async (taskId: string, newStatus: Task["status"]) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)

    await supabase.from("activity_logs").insert({
      user_id: user?.id,
      action: `updated task status to "${newStatus.replace(/_/g, " ")}"`,
      entity_type: "task",
      entity_id: taskId,
    })

    setSaving(false)
    fetchData()
  }

  const handleSubmitForReview = async (task: Task) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("tasks").update({
      status: "pending_review",
      member_comments: memberComments || task.member_comments,
    }).eq("id", task.id)

    await supabase.from("activity_logs").insert({
      user_id: user?.id,
      action: `submitted task "${task.title}" for review`,
      entity_type: "task",
      entity_id: task.id,
    })

    setSaving(false)
    setMemberComments("")
    setDetailsDialogOpen(false)
    fetchData()
  }

  const handleAddNote = async (taskId: string) => {
    if (!newNote.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("progress_notes").insert({
      task_id: taskId,
      user_id: user?.id,
      note: newNote,
    })

    await supabase.from("activity_logs").insert({
      user_id: user?.id,
      action: `added progress note`,
      entity_type: "task",
      entity_id: taskId,
    })

    setSaving(false)
    setNewNote("")
    fetchData()
  }

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task)
    setMemberComments(task.member_comments || "")
    setDetailsDialogOpen(true)
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
      case "high": return "bg-red-500"
      case "medium": return "bg-amber-500"
      case "low": return "bg-green-500"
      default: return "bg-slate-500"
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    return true
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">My Tasks</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
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
      </div>

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">No tasks assigned to you</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={task.status === "needs_rework" ? "border-red-300 bg-red-50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`} />
                    <CardTitle className="text-base">{task.title}</CardTitle>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getStatusColor(task.status)}`}>
                    {task.status.replace(/_/g, " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {task.description || "No description"}
                </p>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                  <p>Project: {task.projects?.name || "No project"}</p>
                  {task.due_date && (
                    <p className={new Date(task.due_date) < new Date() && task.status !== "verified_completed" ? "text-red-600 font-medium" : ""}>
                      Due: {format(new Date(task.due_date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>

                {task.status === "needs_rework" && task.admin_feedback && (
                  <div className="mb-4 p-2 bg-red-100 rounded text-sm text-red-700">
                    <div className="flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      Admin Feedback:
                    </div>
                    <p className="mt-1">{task.admin_feedback}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {task.status !== "verified_completed" && task.status !== "pending_review" && (
                    <Select
                      value={task.status}
                      onValueChange={(value: Task["status"]) => handleStatusUpdate(task.id, value)}
                      disabled={saving}
                    >
                      <SelectTrigger className="flex-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openTaskDetails(task)}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground">{selectedTask.description || "No description"}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status.replace(/_/g, " ")}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(selectedTask.priority).replace("bg-", "bg-").replace("500", "100")} ${getPriorityColor(selectedTask.priority).replace("bg-", "text-").replace("500", "700")}`}>
                    {selectedTask.priority} priority
                  </span>
                </div>
              </div>

              {selectedTask.admin_feedback && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm font-medium text-amber-700">Admin Feedback:</p>
                  <p className="text-sm">{selectedTask.admin_feedback}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Progress Notes</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {progressNotes[selectedTask.id]?.length > 0 ? (
                    progressNotes[selectedTask.id].map((note) => (
                      <div key={note.id} className="p-2 bg-slate-50 rounded text-sm">
                        <p>{note.note}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.profiles?.full_name} - {format(new Date(note.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a progress note..."
                    className="flex-1"
                  />
                  <Button onClick={() => handleAddNote(selectedTask.id)} disabled={saving || !newNote.trim()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {selectedTask.status !== "verified_completed" && selectedTask.status !== "pending_review" && (
                <div className="space-y-2 border-t pt-4">
                  <Label>Submit for Review</Label>
                  <Textarea
                    value={memberComments}
                    onChange={(e) => setMemberComments(e.target.value)}
                    placeholder="Add comments for the admin reviewer..."
                  />
                  <Button
                    onClick={() => handleSubmitForReview(selectedTask)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit for Review
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
