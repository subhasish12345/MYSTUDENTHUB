
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {
  const { user, userRole, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login page
        router.replace("/");
        return;
      }

      // If we have user data, we can decide where to go.
      if (userData) {
          switch (userRole) {
            case "admin":
              router.replace("/dashboard/admin");
              break;
            case "teacher":
              router.replace("/dashboard/teacher");
              break;
            case "student":
               // For students, an extra check to ensure their detailed profile exists
               const studentDocRef = doc(db, "students", user.uid);
               getDoc(studentDocRef).then((docSnap) => {
                   if (docSnap.exists()) {
                       router.replace("/dashboard/student");
                   } else {
                       router.replace("/profile-setup");
                   }
               });
              break;
            default:
              // Fallback for users with a doc but no role, or an unknown role
              router.replace("/profile-setup");
              break;
          }
      } else {
        // If there's no userData after loading, it implies a setup is needed.
        // This handles the case where a /users doc exists but the profile doc doesn't.
        router.replace("/profile-setup");
      }
    }
  }, [user, userRole, userData, loading, router]);

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
