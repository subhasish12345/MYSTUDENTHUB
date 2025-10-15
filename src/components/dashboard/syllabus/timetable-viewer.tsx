"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, DocumentData, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// Assuming these types are defined somewhere accessible
export interface Period {
    time: string;
    subject: string;
}

export interface TimetableData {
    monday?: Period[];
    tuesday?: Period[];
    wednesday?: Period[];
    thursday?: Period[];
    friday?: Period[];
    saturday?: Period[];
    [key: string]: Period[] | undefined;
}


interface TimetableViewerProps {
    specificGroup?: DocumentData | null;
}

export function TimetableViewer({ specificGroup = null }: TimetableViewerProps) {
    const { user, userRole, userData, loading: authLoading } = useAuth();
    const [timetable, setTimetable] = useState<TimetableData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimetable = async () => {
            setLoading(true);
            let groupId: string | null = null;
            
            if (specificGroup) {
                 groupId = specificGroup.id;
            } else if (user && userData && userRole === 'student') {
                const studentDocRef = doc(db, "students", user.uid);
                const studentSnap = await getDoc(studentDocRef);

                if (studentSnap.exists()) {
                    const studentData = studentSnap.data();
                    // Get the latest active semester for the student
                    const semestersQuery = query(collection(studentDocRef, "semesters"), orderBy("semester_no", "desc"));
                    const semestersSnap = await getDocs(semestersQuery);
                    
                    if (!semestersSnap.empty) {
                        const latestSemester = semestersSnap.docs[0].data();
                        const degreeSnap = await getDoc(doc(db, 'degrees', studentData.degree));
                        const streamSnap = await getDoc(doc(db, 'streams', studentData.stream));
                        const batchSnap = await getDoc(doc(db, 'batches', studentData.batch_id));

                        if (degreeSnap.exists() && streamSnap.exists() && batchSnap.exists()) {
                            const degreeName = degreeSnap.data().name;
                            const streamName = streamSnap.data().name;
                            const batchName = batchSnap.data().batch_name;
                            groupId = `${degreeName}_${streamName}_${batchName}_sem${latestSemester.semester_no}_${latestSemester.section}`.replace(/\s+/g, '_');
                        }
                    }
                }
            } else if (user && userData && userRole === 'teacher') {
                if (userData.assignedGroups && userData.assignedGroups.length > 0) {
                    groupId = userData.assignedGroups[0];
                }
            }

            if (groupId) {
                try {
                    const timetableRef = doc(db, "timetables", groupId);
                    const timetableSnap = await getDoc(timetableRef);
                    if (timetableSnap.exists()) {
                        setTimetable(timetableSnap.data() as TimetableData);
                    } else {
                        setTimetable(null);
                    }
                } catch (error) {
                    console.error("Error fetching timetable:", error);
                    setTimetable(null);
                }
            } else {
                setTimetable(null);
            }
            setLoading(false);
        };

        if (!authLoading) {
            fetchTimetable();
        }
    }, [user, userData, userRole, authLoading, specificGroup]);

    const days: (keyof TimetableData)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const maxPeriods = useMemo(() => {
        if (!timetable) return 0;
        return Math.max(...days.map(day => timetable[day]?.length || 0));
    }, [timetable]);


    if (loading) {
        return (
            <Card className="mt-6">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!timetable) {
        return (
            <div className="text-center py-16 border-dashed border-2 rounded-lg mt-6">
                <h3 className="font-headline text-2xl font-semibold">No Timetable Found</h3>
                <p className="text-muted-foreground">
                    A timetable has not been set for your group yet.
                </p>
            </div>
        );
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Weekly Timetable</CardTitle>
                <CardDescription>Your class schedule for the week.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {days.map(day => (
                                <TableHead key={String(day)} className="capitalize text-center">{String(day)}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: maxPeriods }).map((_, rowIndex) => (
                             <TableRow key={rowIndex}>
                                {days.map(day => (
                                    <TableCell key={`${String(day)}-${rowIndex}`} className="text-center h-20 border">
                                        <div className="font-semibold text-primary">{(timetable[day] as Period[])?.[rowIndex]?.time || '-'}</div>
                                        <div className="text-sm text-muted-foreground">{(timetable[day] as Period[])?.[rowIndex]?.subject || ''}</div>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
