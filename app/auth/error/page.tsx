import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">Something went wrong during authentication.</p>
        <Link
          href="/login"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}
