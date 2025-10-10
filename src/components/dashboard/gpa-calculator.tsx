
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { Semester } from "./profile/semester-management";

interface SemesterWithGpa extends Semester {
    sgpa: number;
}

export function GpaCalculator() {
    const { user, userRole, loading: authLoading } = useAuth();
    const [semesters, setSemesters] = useState<SemesterWithGpa[]>([]);
    const [cgpa, setCgpa] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading || !user || userRole !== 'student') {
            setLoading(false);
            return;
        }

        const fetchSemesterData = async () => {
            try {
                const semestersQuery = query(
                    collection(db, "students", user.uid, "semesters"),
                    orderBy("semester_no", "asc")
                );
                const querySnapshot = await getDocs(semestersQuery);
                const semesterData = querySnapshot.docs
                    .map(doc => doc.data() as Semester)
                    .filter(sem => typeof sem.sgpa === 'number') as SemesterWithGpa[];
                
                setSemesters(semesterData);

                if (semesterData.length > 0) {
                    const totalSgpa = semesterData.reduce((sum, sem) => sum + sem.sgpa, 0);
                    const averageCgpa = totalSgpa / semesterData.length;
                    setCgpa(averageCgpa);
                }
            } catch (error) {
                console.error("Error fetching semester data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSemesterData();
    }, [user, userRole, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-2/3" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (userRole !== 'student') {
        return <p className="text-center text-destructive p-8">This page is only accessible to students.</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">GPA / CGPA Calculator</h1>
                <p className="text-muted-foreground">Your academic performance overview based on available semester data.</p>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Semester Grade Point Averages (SGPA)</CardTitle>
                    <CardDescription>All your recorded SGPAs from previous semesters.</CardDescription>
                </CardHeader>
                <CardContent>
                    {semesters.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Semester</TableHead>
                                    <TableHead className="text-right">SGPA</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {semesters.map((sem) => (
                                    <TableRow key={sem.semester_no}>
                                        <TableCell className="font-medium">Semester {sem.semester_no}</TableCell>
                                        <TableCell className="text-right font-semibold">{sem.sgpa.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <p className="text-center text-muted-foreground h-24 flex items-center justify-center">
                            No semester results with SGPA found in your profile.
                        </p>
                    )}
                </CardContent>
            </Card>
            
            {cgpa !== null && (
                <Card className="bg-primary text-primary-foreground shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                         <div>
                            <CardTitle className="font-headline text-2xl">Cumulative GPA (CGPA)</CardTitle>
                            <CardDescription className="text-primary-foreground/80">Your calculated overall grade point average.</CardDescription>
                        </div>
                        <Trophy className="h-12 w-12 text-yellow-300" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-6xl font-bold text-center py-4">{cgpa.toFixed(2)}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
