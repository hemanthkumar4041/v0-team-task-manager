"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ActivityLog } from "@/lib/types"
import { format } from "date-fns"
import { FolderKanban, CheckSquare, User, RefreshCw } from "lucide-react"

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 20
  const supabase = createClient()

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async (pageNum = 0) => {
    setLoading(true)
    const { data, count } = await supabase
      .from("activity_logs")
      .select("*, profiles(full_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1)

    if (data) {
      if (pageNum === 0) {
        setActivities(data)
      } else {
        setActivities((prev) => [...prev, ...data])
      }
      setHasMore((count || 0) > (pageNum + 1) * pageSize)
    }
    setLoading(false)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchActivities(nextPage)
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "project": return <FolderKanban className="h-4 w-4 text-blue-600" />
      case "task": return <CheckSquare className="h-4 w-4 text-green-600" />
      default: return <User className="h-4 w-4 text-slate-600" />
    }
  }

  const groupActivitiesByDate = (activities: ActivityLog[]) => {
    const groups: Record<string, ActivityLog[]> = {}
    activities.forEach((activity) => {
      const date = format(new Date(activity.created_at), "yyyy-MM-dd")
      if (!groups[date]) groups[date] = []
      groups[date].push(activity)
    })
    return groups
  }

  const groupedActivities = groupActivitiesByDate(activities)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity Log</h2>
        <Button
          variant="outline"
          onClick={() => { setPage(0); fetchActivities(0) }}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {activities.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">No activity yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <Card key={date}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border">
                        {getEntityIcon(activity.entity_type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.profiles?.full_name || "Unknown User"}</span>{" "}
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.created_at), "h:mm a")}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
