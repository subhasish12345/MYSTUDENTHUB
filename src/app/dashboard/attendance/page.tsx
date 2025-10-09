"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, DocumentData, setDoc } from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentData } from "@/components/dashboard/admin/student-management";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceReport } from "@/components/dashboard/attendance/attendance-report";
import { UserData } from "@/components/dashboard/admin/teacher-management";


interface Group extends DocumentData {
    id: string;
    groupId: string;
    degree: string;
    stream: string;
    batch: string;
    semester_no: number;
    section: string;
    subjects: string[];
    students: string[];
}

export default function AttendancePage() {
    const { user, userRole, userData } = useAuth();
    const { toast } = useToast();

    const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [students, setStudents] = useState<StudentData[]>([]);
    const [presentStudents, setPresentStudents] = useState<Set<string>>(new Set());

    const [date, setDate] = useState<Date>(new Date());
    const [subject, setSubject] = useState<string>('');

    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [noGroupsExist, setNoGroupsExist] = useState(false);

    // Fetch Teacher's or Admin's Data and Assigned Groups
    useEffect(() => {
        const fetchData = async () => {
            if (!user || userRole === 'student') {
                setLoading(false);
                return;
            }
            try {
                let groupsQuery;
                if (userRole === 'admin') {
                    // Admins can see all groups
                    groupsQuery = query(collection(db, "semesterGroups"));
                } else if (userData && userData.assignedGroups && userData.assignedGroups.length > 0) {
                    // Teachers see their assigned groups
                    groupsQuery = query(collection(db, "semesterGroups"), where("groupId", "in", userData.assignedGroups));
                }
                
                if (groupsQuery) {
                    const groupsSnap = await getDocs(groupsQuery);
                    if (groupsSnap.empty) {
                        setNoGroupsExist(true);
                    } else {
                        setNoGroupsExist(false);
                    }
                    const groupsData = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
                    setAssignedGroups(groupsData);
                } else if (userRole === 'teacher') {
                    // Handle case where teacher has no assigned groups
                    setAssignedGroups([]);
                     setNoGroupsExist(true); // Technically true if they are assigned none
                }
            } catch (error: any) {
                console.error("Error fetching user/group data:", error);
                toast({ title: "Error", description: error.message, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, userRole, userData, toast]);

    // Fetch Students when a group is selected
    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedGroup || selectedGroup.students.length === 0) {
                setStudents([]);
                return;
            }
            setLoadingStudents(true);
            try {
                // Firestore 'in' query is limited to 30 items. 
                const studentIds = selectedGroup.students;
                const studentData: StudentData[] = [];
                // Fetch in chunks of 30
                for (let i = 0; i < studentIds.length; i += 30) {
                    const chunk = studentIds.slice(i, i + 30);
                    if (chunk.length === 0) continue;
                    const studentPromises = chunk.map(uid => getDoc(doc(db, "students", uid)));
                    const studentDocs = await Promise.all(studentPromises);
                    const chunkData = studentDocs
                        .filter(snap => snap.exists())
                        .map(snap => ({ id: snap.id, ...snap.data() } as StudentData));
                    studentData.push(...chunkData);
                }
                
                setStudents(studentData);
                setPresentStudents(new Set(studentData.map(s => s.id))); // Default all to present
            } catch (error: any) {
                toast({ title: "Error fetching students", description: error.message, variant: "destructive" });
            } finally {
                setLoadingStudents(false);
            }
        };

        fetchStudents();
    }, [selectedGroup, toast]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setPresentStudents(new Set(students.map(s => s.id)));
        } else {
            setPresentStudents(new Set());
        }
    }

    const handleStudentCheck = (studentId: string, checked: boolean) => {
        setPresentStudents(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(studentId);
            } else {
                newSet.delete(studentId);
            }
            return newSet;
        });
    }

    const handleSaveAttendance = async () => {
        if (!selectedGroup || !subject || !date || !user) {
            toast({ title: "Missing Information", description: "Please select a group, subject, and date.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const dateString = format(date, "yyyy-MM-dd");
        const attendanceRef = doc(db, "semesterGroups", selectedGroup.id, "attendance", dateString);

        const allStudentIds = selectedGroup.students;
        const presentArray = Array.from(presentStudents);
        const absentArray = allStudentIds.filter(id => !presentStudents.has(id));

        try {
            await setDoc(attendanceRef, {
                date: dateString,
                subject: subject,
                markedBy: user.uid,
                present: presentArray,
                absent: absentArray,
                timestamp: new Date()
            }, { merge: true }); // Use merge to avoid overwriting if attendance for another subject exists on same day
            toast({ title: "Success!", description: `Attendance for ${subject} on ${dateString} has been saved.` });
        } catch (error: any) {
            toast({ title: "Save Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 p-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }
    
    if (userRole === 'student') {
         return <p className="text-center text-destructive p-8">This page is only accessible to teachers and admins.</p>;
    }
    
     if (noGroupsExist) {
        return <p className="text-center text-muted-foreground p-8">
            {userRole === 'admin'
                ? "No semester groups have been created yet. Please create one via the Student Management panel."
                : "You have not been assigned to any groups, or no groups exist yet. Please contact an administrator."
            }
        </p>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            <div>
                <h1 className="font-headline text-3xl font-bold">Attendance Management</h1>
                <p className="text-muted-foreground">Select a group to manage and view attendance.</p>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Select Group</CardTitle>
                </CardHeader>
                <CardContent>
                     <Select onValueChange={(groupId) => setSelectedGroup(assignedGroups.find(g => g.id === groupId) || null)}>
                        <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                            <SelectValue placeholder="Select a group..." />
                        </SelectTrigger>
                        <SelectContent>
                            {assignedGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.groupId.replace(/_/g, ' ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedGroup && (
                 <Tabs defaultValue="mark">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
                        <TabsTrigger value="report">View Report</TabsTrigger>
                    </TabsList>
                    <TabsContent value="mark" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Mark Attendance</CardTitle>
                                        <CardDescription>Select date and subject for the session.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Subject</label>
                                            <Select onValueChange={setSubject} value={subject}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a subject..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedGroup.subjects.map(sub => (
                                                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" onClick={handleSaveAttendance} disabled={isSubmitting || !subject || !date}>
                                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
                                            Save Attendance
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Student List</CardTitle>
                                        <CardDescription>
                                            {`${selectedGroup.groupId.replace(/_/g, ' ')} - ${students.length} students`}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingStudents ? (
                                            <div className="space-y-2">
                                                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                            </div>
                                        ) : students.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[50px]">
                                                            <Checkbox
                                                                checked={presentStudents.size === students.length && students.length > 0}
                                                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                                            />
                                                        </TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Registration No.</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {students.map(student => (
                                                        <TableRow key={student.id}>
                                                            <TableCell>
                                                                <Checkbox 
                                                                    checked={presentStudents.has(student.id)}
                                                                    onCheckedChange={(checked) => handleStudentCheck(student.id, checked as boolean)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-medium">{student.name}</TableCell>
                                                            <TableCell>{student.reg_no}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-center text-muted-foreground h-40 flex items-center justify-center">
                                                No students found in this group.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="report" className="mt-6">
                        <AttendanceReport selectedGroup={selectedGroup} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
