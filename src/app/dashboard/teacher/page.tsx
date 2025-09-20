
"use client";
import { useAuth } from "@/hooks/use-auth";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const userName = user?.displayName || "Teacher";

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Welcome, {userName}!</h1>
        <p className="text-muted-foreground">This is your dedicated dashboard to manage your courses and students.</p>
      </div>
      {/* Teacher-specific components will go here */}
    </div>
  );
}
