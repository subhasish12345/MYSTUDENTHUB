
"use client";

import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc, collection, getDocs, where, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserData } from "@/components/dashboard/admin/teacher-management";
import { BookOpen, Calendar, Users } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StudentData } from "../admin/student-management";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface GroupWithStudents {
  groupId: string;
  students: StudentData[];
}

export default function TeacherDashboardPage() {
  const { user, userData: teacherData, loading: authLoading } = useAuth();
  const [studentGroups, setStudentGroups] = useState<GroupWithStudents[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  useEffect(() => {
    const fetchStudentGroups = async () => {
        if (!teacherData || !teacherData.assignedGroups || teacherData.assignedGroups.length === 0) {
            setLoadingStudents(false);
            return;
        }

        setLoadingStudents(true);
        try {
            const groupsQuery = query(collection(db, "semesterGroups"), where("groupId", "in", teacherData.assignedGroups));
            const groupsSnap = await getDocs(groupsQuery);
            
            const groupPromises = groupsSnap.docs.map(async (groupDoc) => {
                const groupData = groupDoc.data();
                const studentIds = groupData.students || [];
                let studentDetails: StudentData[] = [];
                
                if(studentIds.length > 0) {
                    const studentPromises = studentIds.map((uid: string) => getDoc(doc(db, "students", uid)));
                    const studentDocs = await Promise.all(studentPromises);
                    studentDetails = studentDocs
                        .filter(snap => snap.exists())
                        .map(snap => ({ id: snap.id, ...snap.data() } as StudentData));
                }

                return {
                    groupId: groupData.groupId,
                    students: studentDetails.sort((a,b) => a.name.localeCompare(b.name)),
                };
            });

            const resolvedGroups = await Promise.all(groupPromises);
            setStudentGroups(resolvedGroups.sort((a,b) => a.groupId.localeCompare(b.groupId)));

        } catch (error) {
            console.error("Error fetching student groups:", error);
        } finally {
            setLoadingStudents(false);
        }
    };
    
    if(!authLoading) {
      fetchStudentGroups();
    }
  }, [teacherData, authLoading]);


  if (authLoading) {
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
  
  if (!user) {
    return <p className="text-center text-muted-foreground">Please log in to view your dashboard.</p>;
  }

  if (!teacherData) {
      return <p className="text-center text-destructive">No teacher profile found. Please contact an administrator or complete your profile setup.</p>;
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
                    {teacherData.subjects.map((subject: string, index: number) => (
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
             <p className="text-muted-foreground">{studentGroups.reduce((acc, group) => acc + group.students.length, 0)} students across {studentGroups.length} groups.</p>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="font-headline text-2xl font-bold mt-8 mb-4">My Student Groups</h2>
        {loadingStudents ? (
             <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
             </div>
        ) : studentGroups.length > 0 ? (
             <Accordion type="multiple" className="w-full space-y-4">
                {studentGroups.map(group => (
                    <AccordionItem key={group.groupId} value={group.groupId} className="border rounded-lg bg-card">
                        <AccordionTrigger className="p-4 md:p-6 font-semibold text-left">
                           {group.groupId.replace(/_/g, ' ')} ({group.students.length} students)
                        </AccordionTrigger>
                        <AccordionContent className="p-4 md:p-6 pt-0">
                           {group.students.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16"></TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Registration No.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.students.map(student => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={student.photoURL} alt={student.name} data-ai-hint="person face" />
                                                    <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.reg_no}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                           ) : (
                            <p className="text-center text-muted-foreground p-4">No students have been assigned to this group yet.</p>
                           )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
             </Accordion>
        ) : (
            <p className="text-center text-muted-foreground py-8">You have not been assigned to any student groups.</p>
        )}

      </div>
    </div>
  );
}
