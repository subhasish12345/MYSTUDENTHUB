"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Period, TimetableData } from './actions';

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
            } else if (user && userData) {
                // Determine the group ID based on user role
                if (userRole === 'student') {
                    // Assuming student has one primary group for now.
                    // This logic should be more robust in a real app.
                    const semQuery = query(collection(db, `students/${user.uid}/semesters`), where("active", "==", true));
                    const semSnap = await getDocs(semQuery);
                    if (!semSnap.empty) {
                        const semData = semSnap.docs[0].data();
                        const degree = await getDoc(doc(db, 'degrees', userData.degree));
                        const stream = await getDoc(doc(db, 'streams', userData.stream));
                        const batch = await getDoc(doc(db, 'batches', userData.batch_id));

                        if(degree.exists() && stream.exists() && batch.exists()) {
                            groupId = `${degree.data().name}_${stream.data().name}_${batch.data().batch_name}_sem${semData.semester_no}_${semData.section}`.replace(/\s+/g, '_');
                        }
                    }
                } else if (userRole === 'teacher') {
                    // For teachers, we'll just show the first assigned group's timetable as an example.
                    // A group selector would be needed for teachers to view different timetables.
                    if (userData.assignedGroups && userData.assignedGroups.length > 0) {
                        groupId = userData.assignedGroups[0];
                    }
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
                            <TableHead className="w-[120px]">Time</TableHead>
                            {days.map(day => (
                                <TableHead key={String(day)} className="capitalize">{String(day)}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* This is a simplified rendering. A more robust solution would handle overlapping times. */}
                        {Array.from({ length: 8 }).map((_, rowIndex) => (
                             <TableRow key={rowIndex}>
                                 <TableCell className="font-semibold">
                                     {timetable.monday[rowIndex]?.time || '-'}
                                 </TableCell>
                                {days.map(day => (
                                    <TableCell key={`${String(day)}-${rowIndex}`}>
                                        {(timetable[day] as Period[])?.[rowIndex]?.subject || ''}
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
