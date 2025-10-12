
"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, DocumentData, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { StudentData } from '../admin/student-management';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface AttendanceRecord {
    id: string;
    present: string[];
}

interface Group extends DocumentData {
    id: string;
    groupId: string;
    students: string[];
}

interface StudentAttendance {
    id: string;
    name: string;
    reg_no: string;
    attended: number;
    total: number;
    percentage: number;
}

export function AttendanceReport({ selectedGroup }: { selectedGroup: Group | null }) {
    const { toast } = useToast();
    const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!selectedGroup) {
                setAttendanceData([]);
                return;
            }
            setLoading(true);
            try {
                // 1. Fetch all attendance records for the group
                const attendanceQuery = query(collection(db, "semesterGroups", selectedGroup.id, "attendance"));
                const attendanceSnap = await getDocs(attendanceQuery);
                const records = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
                const totalClasses = records.length;

                if (totalClasses === 0) {
                    setAttendanceData([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch all student details
                const studentIds = selectedGroup.students;
                const studentDetails: Record<string, {name: string; reg_no: string}> = {};
                
                // Fetch in chunks of 30
                for (let i = 0; i < studentIds.length; i += 30) {
                    const chunk = studentIds.slice(i, i + 30);
                    const studentPromises = chunk.map(uid => getDoc(doc(db, "students", uid)));
                    const studentDocs = await Promise.all(studentPromises);
                    studentDocs.forEach(snap => {
                        if (snap.exists()) {
                            const data = snap.data() as StudentData;
                            studentDetails[snap.id] = { name: data.name, reg_no: data.reg_no };
                        }
                    });
                }
                
                // 3. Calculate attendance for each student
                const calculatedData = studentIds.map(studentId => {
                    const attendedCount = records.filter(rec => rec.present.includes(studentId)).length;
                    const percentage = totalClasses > 0 ? (attendedCount / totalClasses) * 100 : 0;
                    
                    return {
                        id: studentId,
                        name: studentDetails[studentId]?.name || 'Unknown Student',
                        reg_no: studentDetails[studentId]?.reg_no || 'N/A',
                        attended: attendedCount,
                        total: totalClasses,
                        percentage: percentage
                    };
                });

                setAttendanceData(calculatedData.sort((a, b) => a.name.localeCompare(b.name)));

            } catch (error: any) {
                console.error("Error fetching attendance report:", error);
                toast({ title: "Error", description: "Could not fetch the attendance report.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceData();
    }, [selectedGroup, toast]);

    const handleDownload = () => {
        if (!selectedGroup || attendanceData.length === 0) return;
        setIsDownloading(true);

        const doc = new jsPDF();
        const title = `Attendance Report: ${selectedGroup.groupId.replace(/_/g, ' ')}`;
        const date = `Generated on: ${format(new Date(), 'yyyy-MM-dd')}`;
        
        doc.text(title, 14, 15);
        doc.setFontSize(10);
        doc.text(date, 14, 20);

        const head = [['Student Name', 'Registration No.', 'Classes Attended', 'Total Classes', 'Percentage']];
        const body = attendanceData.map(s => [
            s.name,
            s.reg_no,
            s.attended,
            s.total,
            `${s.percentage.toFixed(1)}%`
        ]);

        doc.autoTable({
            head,
            body,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 160, 133] },
        });

        doc.save(`Attendance_${selectedGroup.groupId}_${format(new Date(), 'yyyyMMdd')}.pdf`);
        setIsDownloading(false);
    };


    const getProgressColor = (percentage: number) => {
        if (percentage < 75) return "bg-red-500";
        if (percentage < 90) return "bg-yellow-500";
        return "bg-green-500";
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Attendance Report</CardTitle>
                    <CardDescription>
                        Summary of student attendance for the selected group.
                    </CardDescription>
                </div>
                <Button onClick={handleDownload} disabled={isDownloading || attendanceData.length === 0}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                    Download Report
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : attendanceData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Registration No.</TableHead>
                                    <TableHead>Classes Attended</TableHead>
                                    <TableHead className="w-[250px]">Attendance Percentage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceData.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.reg_no}</TableCell>
                                        <TableCell>{student.attended} / {student.total}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={student.percentage} className="h-2 [&>div]:bg-primary" />
                                                <span className="font-semibold text-right w-12">{student.percentage.toFixed(1)}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground h-40 flex items-center justify-center">
                        No attendance records found for this group. Start by marking attendance.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
