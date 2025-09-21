
"use client";

import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserData } from "@/components/dashboard/admin/teacher-management";
import { BookOpen, Calendar, Users } from "lucide-react";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [teacherData, setTeacherData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure this component only renders on the client to avoid hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user && isClient) {
      const fetchUserData = async () => {
        setLoading(true);
        console.log("Fetching data for user UID:", user.uid);
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          console.log("Teacher document found:", docSnap.data());
          setTeacherData(docSnap.data() as UserData);
        } else {
          console.error("No teacher document found for UID:", user.uid);
          // Explicitly set teacherData to null if doc doesn't exist
          setTeacherData(null);
        }
        setLoading(false);
      };
      fetchUserData();
    } else if (isClient) {
      // If there's no user on the client, stop loading
      console.log("No user found on client-side.");
      setLoading(false);
    }
  }, [user, isClient]);

  // While waiting for client-side render and data fetching, show skeletons
  if (!isClient || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }
  
  // After loading, if there's no user, prompt login (though routing should handle this)
  if (!user) {
    return <p className="text-center text-muted-foreground">Please log in to view your dashboard.</p>;
  }

  // If user is logged in but profile data doesn't exist in Firestore
  if (!teacherData) {
      return <p className="text-center text-destructive">No teacher profile found. Please contact an administrator.</p>;
  }


  const userName = teacherData?.name || "Teacher";

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Welcome, {userName}!</h1>
        <p className="text-muted-foreground">This is your dedicated dashboard to manage your courses and students.</p>
      </div>

       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">My Courses</CardTitle>
            <BookOpen className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            {teacherData?.subjects && teacherData.subjects.length > 0 ? (
                <ul className="space-y-2">
                    {teacherData.subjects.map((subject, index) => (
                        <li key={index} className="text-muted-foreground">{subject}</li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted-foreground">No courses assigned.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">Upcoming Classes</CardTitle>
            <Calendar className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Feature coming soon.</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">My Students</CardTitle>
            <Users className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">Feature coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
