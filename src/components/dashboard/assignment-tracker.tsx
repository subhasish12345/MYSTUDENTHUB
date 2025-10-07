
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, DocumentData, orderBy, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { StudentData } from "./admin/student-management";

// Define the structure of an Assignment
export interface Assignment extends DocumentData {
    id: string;
    title: string;
    description: string;
    dueDate: any; // Firestore Timestamp
    subject: string;
    groupId: string; // ID of the semesterGroup it's for
    fileURL?: string;
    googleFormLink?: string;
    createdBy: string;
    createdAt: any;
}


export function AssignmentTracker() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        setLoading(true);

        const fetchStudentAndAssignmentData = async () => {
             try {
                let studentGroupId: string | null = null;
                if (userRole === 'student') {
                    const studentDocRef = doc(db, "students", user.uid);
                    const studentDoc = await getDoc(studentDocRef);
                    if (studentDoc.exists()) {
                        const data = studentDoc.data() as StudentData;
                        setStudentData(data);
                        // This is a simplification. A student can be in multiple groups over time.
                        // For now, we'll just try to find one relevant group.
                        const semestersQuery = query(collection(db, "students", user.uid, "semesters"), orderBy("semester_no", "desc"));
                        const semestersSnap = await getDocs(semestersQuery);
                        if (!semestersSnap.empty) {
                            const latestSemester = semestersSnap.docs[0].data();
                             const degreeDoc = await getDoc(doc(db, 'degrees', data.degree));
                             const streamDoc = await getDoc(doc(db, 'streams', data.stream));
                             const batchDoc = await getDoc(doc(db, 'batches', data.batch_id));
                            if(degreeDoc.exists() && streamDoc.exists() && batchDoc.exists()) {
                                const degreeName = degreeDoc.data().name;
                                const streamName = streamDoc.data().name;
                                const batchName = batchDoc.data().batch_name;
                                studentGroupId = `${degreeName}_${streamName}_${batchName}_sem${latestSemester.semester_no}_${latestSemester.section}`.replace(/\s+/g, '_');
                            }
                        }
                    }
                }

                // Setup the Firestore listener
                let assignmentsQuery;
                if (isTeacherOrAdmin) {
                    // Teachers/Admins see all assignments
                    assignmentsQuery = query(collection(db, "assignments"), orderBy("dueDate", "desc"));
                } else if (studentGroupId) {
                    // Students see assignments for their group
                    assignmentsQuery = query(collection(db, "assignments"), where("groupId", "==", studentGroupId), orderBy("dueDate", "desc"));
                } else {
                     setLoading(false);
                    return; // No query to run
                }

                 const unsubscribe = onSnapshot(assignmentsQuery, (snapshot) => {
                    const assignmentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
                    setAssignments(assignmentsData);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching assignments:", error);
                    toast({ title: "Error", description: "Could not fetch assignments.", variant: "destructive" });
                    setLoading(false);
                });

                return unsubscribe;

            } catch (error) {
                 console.error("Error setting up assignment tracker:", error);
                 toast({ title: "Error", description: "Could not initialize assignment tracker.", variant: "destructive"});
                 setLoading(false);
            }
        }
        
        let unsubscribe: (() => void) | undefined;
        fetchStudentAndAssignmentData().then(unsub => {
            if (unsub) unsubscribe = unsub;
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };

    }, [user, userRole, toast, isTeacherOrAdmin]);

    const getStatus = (dueDate: Date): { text: string; variant: "destructive" | "secondary" | "default" } => {
        const now = new Date();
        if (now > dueDate) {
            return { text: 'Past Due', variant: 'destructive' };
        }
        return { text: 'Pending', variant: 'secondary' };
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Assignment Tracker</h1>
                        <p className="text-muted-foreground">Keep track of your assignments and due dates.</p>
                    </div>
                    {isTeacherOrAdmin && (
                        <Button onClick={() => setIsSheetOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Assignment
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Your Assignments</CardTitle>
                        <CardDescription>
                            {isTeacherOrAdmin ? "You are viewing all assignments." : "Showing assignments relevant to your group."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : assignments.length > 0 ? (
                                    assignments.map((assignment) => {
                                        const dueDate = assignment.dueDate.toDate();
                                        const status = getStatus(dueDate);
                                        const link = assignment.googleFormLink || assignment.fileURL;

                                        return (
                                            <TableRow key={assignment.id}>
                                                <TableCell className="font-medium">{assignment.subject}</TableCell>
                                                <TableCell>{assignment.title}</TableCell>
                                                <TableCell>{format(dueDate, "PPP")}</TableCell>
                                                <TableCell>
                                                    <Badge variant={status.variant}>{status.text}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {link ? (
                                                         <Button variant="outline" size="sm" asChild>
                                                            <a href={link} target="_blank" rel="noopener noreferrer">
                                                                <Download className="mr-2 h-4 w-4" />
                                                                View
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                         <Button variant="outline" size="sm" disabled>
                                                            No Link
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No assignments found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             {/* <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-full">
                    <SheetHeader>
                        <SheetTitle>Create New Assignment</SheetTitle>
                        <SheetDescription>
                            Fill in the details for the new assignment.
                        </SheetDescription>
                    </SheetHeader>
                    
                </SheetContent>
            </Sheet> */}
        </>
    );
}
