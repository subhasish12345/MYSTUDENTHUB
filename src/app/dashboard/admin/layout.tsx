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
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  const isAuthorized = userRole === "admin" || user?.email === "sadmisn@gmail.com";

  useEffect(() => {
    if (!loading && !isAuthorized) {
      router.replace("/dashboard");
    }
  }, [user, userRole, loading, router, isAuthorized]);

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

  return <>{children}</>;
}