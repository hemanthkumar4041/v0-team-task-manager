"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react"
import type { Project, Profile, ProjectMember } from "@/lib/types"
import { format } from "date-fns"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [projectMembers, setProjectMembers] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    deadline: "",
    status: "not_started" as Project["status"],
  })
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [projectsRes, membersRes, projectMembersRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "member"),
      supabase.from("project_members").select("*"),
    ])

    if (projectsRes.data) setProjects(projectsRes.data)
    if (membersRes.data) setMembers(membersRes.data)
    
    if (projectMembersRes.data) {
      const memberMap: Record<string, string[]> = {}
      projectMembersRes.data.forEach((pm: ProjectMember) => {
        if (!memberMap[pm.project_id]) memberMap[pm.project_id] = []
        memberMap[pm.project_id].push(pm.user_id)
      })
      setProjectMembers(memberMap)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (selectedProject) {
      await supabase
        .from("projects")
        .update(formData)
        .eq("id", selectedProject.id)

      await supabase.from("activity_logs").insert({
        user_id: user?.id,
        action: `updated project "${formData.name}"`,
        entity_type: "project",
        entity_id: selectedProject.id,
      })
    } else {
      const { data: newProject } = await supabase
        .from("projects")
        .insert({ ...formData, created_by: user?.id })
        .select()
        .single()

      if (newProject) {
        await supabase.from("activity_logs").insert({
          user_id: user?.id,
          action: `created project "${formData.name}"`,
          entity_type: "project",
          entity_id: newProject.id,
        })
      }
    }

    setSaving(false)
    setDialogOpen(false)
    resetForm()
    fetchData()
  }

  const handleDelete = async (project: Project) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("projects").delete().eq("id", project.id)
    await supabase.from("activity_logs").insert({
      user_id: user?.id,
      action: `deleted project "${project.name}"`,
      entity_type: "project",
      entity_id: project.id,
    })

    fetchData()
  }

  const handleMemberToggle = async (projectId: string, userId: string, isAssigned: boolean) => {
    if (isAssigned) {
      await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId)
    } else {
      await supabase.from("project_members").insert({ project_id: projectId, user_id: userId })
    }
    fetchData()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      start_date: "",
      deadline: "",
      status: "not_started",
    })
    setSelectedProject(null)
  }

  const openEditDialog = (project: Project) => {
    setSelectedProject(project)
    setFormData({
      name: project.name,
      description: project.description || "",
      start_date: project.start_date || "",
      deadline: project.deadline || "",
      status: project.status,
    })
    setDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started": return "bg-slate-100 text-slate-700"
      case "in_progress": return "bg-blue-100 text-blue-700"
      case "completed": return "bg-green-100 text-green-700"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProject ? "Edit Project" : "Create New Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: Project["status"]) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {selectedProject ? "Update Project" : "Create Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">No projects yet. Create your first project!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)}`}>
                    {project.status.replace(/_/g, " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description || "No description"}
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  {project.start_date && (
                    <p>Start: {format(new Date(project.start_date), "MMM d, yyyy")}</p>
                  )}
                  {project.deadline && (
                    <p>Deadline: {format(new Date(project.deadline), "MMM d, yyyy")}</p>
                  )}
                  <p>Members: {projectMembers[project.id]?.length || 0}</p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedProject(project); setMembersDialogOpen(true) }}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(project)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(project)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Team Members - {selectedProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No team members available</p>
            ) : (
              members.map((member) => {
                const isAssigned = selectedProject ? projectMembers[selectedProject.id]?.includes(member.id) : false
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isAssigned ? "default" : "outline"}
                      onClick={() => selectedProject && handleMemberToggle(selectedProject.id, member.id, isAssigned)}
                    >
                      {isAssigned ? "Remove" : "Add"}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
