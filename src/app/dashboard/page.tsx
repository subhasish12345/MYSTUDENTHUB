"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

      // Check if user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (!docSnap.exists()) {
          // If profile doesn't exist, redirect to setup page
          router.replace("/profile-setup");
        } else {
          // Profile exists, proceed with role-based redirection
          const userData = docSnap.data();
          switch (userData.role) {
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
              // Fallback for users with a doc but no role
              router.replace("/profile-setup");
              break;
          }
        }
      });
    }
  }, [user, userRole, loading, router]);

  // Show a full-page loading screen while checking auth and redirecting
  return (
    <div className="flex items-center justify-center h-screen">
        <div className="space-y-6 p-8 w-full max-w-md">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <div className="space-y-4 mt-8">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    </div>
  );
}
