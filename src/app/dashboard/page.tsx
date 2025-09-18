"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login page
        router.replace("/");
        return;
      }

      // Redirect based on role
      switch (userRole) {
        case "admin":
          router.replace("/dashboard/admin");
          break;
        case "teacher":
          router.replace("/dashboard/teacher");
          break;
        case "student":
          router.replace("/dashboard/student");
          break;
        default:
          // If role is null or not recognized, maybe redirect to a generic page or show an error
          // For now, redirecting to login
          router.replace("/");
          break;
      }
    }
  }, [user, userRole, loading, router]);

  // Show a loading screen while checking auth and redirecting
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-6 w-3/4" />
      <div className="grid gap-8 lg:grid-cols-5 mt-8">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
