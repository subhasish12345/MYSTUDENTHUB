
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, ArrowRight, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { UserData } from "@/components/dashboard/admin/teacher-management";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { assignments } from "@/lib/placeholder-data";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user && isClient) {
      const fetchUserData = async () => {
        setLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setStudentData(docSnap.data() as UserData);
        } else {
          setStudentData(null);
        }
        setLoading(false);
      };
      fetchUserData();
    } else if (isClient) {
      setLoading(false);
    }
  }, [user, isClient]);

  if (!isClient || loading) {
    return (
       <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 w-full lg:col-span-2" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!studentData) {
      return <p className="text-center text-destructive">No student profile found. Please contact an administrator or complete your profile setup.</p>;
  }

  const userName = studentData?.name || "Student";

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Welcome, {userName}!</h1>
        <p className="text-muted-foreground">Here's a quick overview of your academic life.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-5">
           <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="font-headline">Upcoming Assignments</CardTitle>
              </div>
               <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/assignments">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {assignments.slice(0, 3).map((assignment) => (
                  <li key={assignment.id} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                     <div className="flex flex-col items-center justify-center p-2 rounded-md bg-background text-foreground border">
                        <span className="text-xs font-bold uppercase">{format(new Date(assignment.dueDate), 'MMM')}</span>
                        <span className="text-xl font-bold text-primary">{format(new Date(assignment.dueDate), 'dd')}</span>
                     </div>
                    <div className="flex-1">
                      <p className="font-semibold">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <Badge variant={assignment.status === 'Pending' ? 'default' : 'secondary'}>{assignment.status}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
