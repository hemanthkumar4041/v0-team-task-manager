import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClipboardList, Users, CheckSquare, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl">Team Task Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Manage Your Team Tasks
              <br />
              <span className="text-blue-600">Efficiently</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              A simple and effective task management system for teams. 
              Create projects, assign tasks, track progress, and review work - all in one place.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Project Management</h3>
                <p className="text-sm text-slate-600">Create and organize projects with deadlines and team assignments</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Task Tracking</h3>
                <p className="text-sm text-slate-600">Assign tasks, set priorities, and track progress in real-time</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Team Collaboration</h3>
                <p className="text-sm text-slate-600">Admin and member roles with different permissions</p>
              </div>
              <div className="text-center">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-semibold mb-2">Review System</h3>
                <p className="text-sm text-slate-600">Submit tasks for review and get feedback from admins</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Create Account</h3>
                <p className="text-sm text-slate-600">Sign up as an admin or team member</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">Set Up Projects</h3>
                <p className="text-sm text-slate-600">Admins create projects and assign team members</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Track & Review</h3>
                <p className="text-sm text-slate-600">Members complete tasks, admins review and provide feedback</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white py-8 px-4">
        <div className="container mx-auto text-center text-sm text-slate-600">
          <p>Team Task Manager - A College Assessment Project</p>
          <p className="mt-2">Built with Next.js, Supabase, and Tailwind CSS</p>
        </div>
      </footer>
    </div>
  )
}
