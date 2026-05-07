export interface Profile {
  id: string
  full_name: string
  email: string
  role: "admin" | "member"
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  start_date: string | null
  deadline: string | null
  status: "not_started" | "in_progress" | "completed"
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  added_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  project_id: string | null
  assigned_to: string | null
  due_date: string | null
  priority: "low" | "medium" | "high"
  status: "not_started" | "in_progress" | "pending_review" | "verified_completed" | "needs_rework" | "overdue"
  member_comments: string | null
  admin_feedback: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  projects?: Project
}

export interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: string | null
  created_at: string
  profiles?: Profile
}

export interface ProgressNote {
  id: string
  task_id: string
  user_id: string | null
  note: string
  created_at: string
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface TaskReview {
  id: string
  task_id: string
  reviewer_id: string | null
  status: "approved" | "rework_requested"
  comments: string | null
  created_at: string
  profiles?: Profile
}
