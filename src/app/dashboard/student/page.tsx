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
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Assignment } from "@/components/dashboard/assignment-tracker";
import { StudentData } from "@/components/dashboard/admin/student-management";


export default function StudentDashboardPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (authLoading || !isClient) return;
    
    if (user && userData) {
      setLoading(true);
      const fetchStudentDataAndAssignments = async () => {
          const studentDocRef = doc(db, "students", user.uid);
          const studentDoc = await getDoc(studentDocRef);
          if (!studentDoc.exists()) {
              setLoading(false);
              return;
          }
          const studentData = studentDoc.data() as StudentData;

          // Fetch groups
          const semestersQuery = query(collection(db, "students", user.uid, "semesters"));
          const semestersSnap = await getDocs(semestersQuery);
          let studentGroupIds: string[] = [];
          if (!semestersSnap.empty) {
              const degreeDoc = await getDoc(doc(db, 'degrees', studentData.degree));
              const streamDoc = await getDoc(doc(db, 'streams', studentData.stream));
              const batchDoc = await getDoc(doc(db, 'batches', studentData.batch_id));
              if(degreeDoc.exists() && streamDoc.exists() && batchDoc.exists()) {
                  const degreeName = degreeDoc.data().name;
                  const streamName = streamDoc.data().name;
                  const batchName = batchDoc.data().batch_name;
                  studentGroupIds = semestersSnap.docs.map(semDoc => {
                      const semData = semDoc.data();
                      return `${degreeName}_${streamName}_${batchName}_sem${semData.semester_no}_${semData.section}`.replace(/\s+/g, '_');
                  });
              }
          }
          
          if (studentGroupIds.length > 0) {
              const assignmentsQuery = query(collection(db, "assignments"), where("groupId", "in", studentGroupIds));
              const unsubscribe = onSnapshot(assignmentsQuery, (snapshot) => {
                  const assignmentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
                  assignmentsData.sort((a, b) => b.dueDate.toDate() - a.dueDate.toDate());
                  setAssignments(assignmentsData);
                  setLoading(false);
              });
              return unsubscribe;
          } else {
              setAssignments([]);
              setLoading(false);
          }
      };

      let unsubscribe: (() => void) | undefined;
      fetchStudentDataAndAssignments().then(unsub => {
        if(unsub) unsubscribe = unsub;
      });

      return () => {
          if (unsubscribe) unsubscribe();
      }
    } else {
      setLoading(false);
    }
  }, [user, userData, isClient, authLoading]);

  const getStatus = (dueDate: Date): { text: string; variant: "destructive" | "secondary" | "default" } => {
    const now = new Date();
    if (now > dueDate) {
        return { text: 'Past Due', variant: 'destructive' };
    }
    return { text: 'Pending', variant: 'secondary' };
  };


  if (!isClient || authLoading || loading) {
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

  if (!userData) {
      return <p className="text-center text-destructive">No student profile found. Please contact an administrator or complete your profile setup.</p>;
  }

  const userName = userData?.name || "Student";

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
             {assignments.length > 0 ? (
                <ul className="space-y-4">
                  {assignments.slice(0, 3).map((assignment) => {
                      const dueDate = assignment.dueDate.toDate();
                      const status = getStatus(dueDate);
                      return (
                        <li key={assignment.id} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-background text-foreground border">
                              <span className="text-xs font-bold uppercase">{format(dueDate, 'MMM')}</span>
                              <span className="text-xl font-bold text-primary">{format(dueDate, 'dd')}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{assignment.title}</p>
                            <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                          </div>
                          <Badge variant={status.variant}>{status.text}</Badge>
                        </li>
                      );
                  })}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-8">No assignments found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
