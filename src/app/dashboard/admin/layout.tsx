"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, loading } = useAuth();
  const router = useRouter();

  // The admin check is now robust and happens inside useAuth
  const isAuthorized = userRole === "admin";

  useEffect(() => {
    if (!loading && !isAuthorized) {
      // If not loading and not an authorized admin, redirect away.
      router.replace("/dashboard");
    }
  }, [userRole, loading, router, isAuthorized]);

  // While loading, or if not yet authorized, show a skeleton screen.
  // This prevents content flashing before the redirect can happen.
  if (loading || !isAuthorized) {
    return (
        <div className="space-y-6 p-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-4 mt-8">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
      </div>
    );
  }

  // If loading is finished and the user is authorized, render the children.
  return <>{children}</>;
}
