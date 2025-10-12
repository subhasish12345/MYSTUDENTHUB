"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from "date-fns";
import { StudentData } from "./student-management";
import { Semester } from "../profile/semester-management";

// Extend jsPDF with autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export function ReportGeneration() {
    const { toast } = useToast();
    const [loading, setLoading] = useState<Record<string, boolean>>({
        students: false,
        grades: false,
        feedback: false,
    });

    const handleDownload = async (reportType: 'students' | 'grades' | 'feedback') => {
        setLoading(prev => ({ ...prev, [reportType]: true }));
        try {
            const doc = new jsPDF();
            const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${format(new Date(), 'yyyy-MM-dd')}`;
            doc.text(title, 14, 15);

            let head: string[][] = [];
            let body: any[][] = [];

            switch (reportType) {
                case 'students':
                    head = [['Name', 'Reg No', 'Email', 'Degree', 'Stream', 'Batch']];
                    const studentsSnap = await getDocs(collection(db, "students"));
                    const studentData = studentsSnap.docs.map(d => ({...d.data(), id: d.id } as StudentData));

                    // Fetch maps for display names
                    const degrees = await getDocs(collection(db, 'degrees')).then(snap => snap.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data().name}), {}));
                    const streams = await getDocs(collection(db, 'streams')).then(snap => snap.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data().name}), {}));
                    const batches = await getDocs(collection(db, 'batches')).then(snap => snap.docs.reduce((acc, doc) => ({...acc, [doc.id]: doc.data().batch_name}), {}));

                    body = studentData.map(s => [
                        s.name,
                        s.reg_no,
                        s.email,
                        degrees[s.degree] || s.degree,
                        streams[s.stream] || s.stream,
                        batches[s.batch_id] || s.batch_id
                    ]);
                    break;
                case 'feedback':
                    head = [['Date', 'Author', 'Type', 'Subject', 'Rating', 'Comment']];
                    const feedbackSnap = await getDocs(collection(db, "feedback"));
                    body = feedbackSnap.docs.map(d => d.data()).map(f => [
                        f.createdAt ? format(f.createdAt.toDate(), 'PP') : 'N/A',
                        f.studentName,
                        f.feedbackType,
                        f.subjectName,
                        f.rating,
                        f.comment,
                    ]);
                    break;
                case 'grades':
                    head = [['Name', 'Reg No', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'CGPA']];
                    const studentsSnapshot = await getDocs(collection(db, "students"));
                    const studentPromises = studentsSnapshot.docs.map(async (studentDoc) => {
                        const student = studentDoc.data() as StudentData;
                        const semestersSnap = await getDocs(collection(db, `students/${studentDoc.id}/semesters`));
                        const semesters = semestersSnap.docs.map(d => d.data() as Semester);
                        
                        const sgpaArray = Array(8).fill('N/A');
                        let totalSgpa = 0;
                        let gradedSemesters = 0;

                        semesters.forEach(sem => {
                            if (sem.sgpa !== null && sem.sgpa !== undefined && sem.semester_no <= 8) {
                                sgpaArray[sem.semester_no - 1] = sem.sgpa.toFixed(2);
                                totalSgpa += sem.sgpa;
                                gradedSemesters++;
                            }
                        });
                        
                        const cgpa = gradedSemesters > 0 ? (totalSgpa / gradedSemesters).toFixed(2) : 'N/A';
                        
                        return [student.name, student.reg_no, ...sgpaArray, cgpa];
                    });
                    body = await Promise.all(studentPromises);
                    break;
            }

            doc.autoTable({
                head,
                body,
                startY: 20,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [22, 160, 133] },
            });
            doc.save(`${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

        } catch (error: any) {
            console.error(`Error downloading ${reportType} report:`, error);
            toast({ title: "Error", description: `Could not download ${reportType} report.`, variant: "destructive" });
        } finally {
            setLoading(prev => ({ ...prev, [reportType]: false }));
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Report Generation</CardTitle>
                <CardDescription>Download various reports as PDF documents for offline use and record-keeping.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader>
                        <CardTitle>Student List</CardTitle>
                        <CardDescription>Download a complete list of all students registered in the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={() => handleDownload('students')} disabled={loading.students}>
                            {loading.students ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Grade Report</CardTitle>
                        <CardDescription>A consolidated report of SGPA and CGPA for all students across all semesters.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={() => handleDownload('grades')} disabled={loading.grades}>
                            {loading.grades ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Feedback Report</CardTitle>
                        <CardDescription>Download all feedback submissions from students regarding faculty and events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={() => handleDownload('feedback')} disabled={loading.feedback}>
                            {loading.feedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}
