"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { UserData } from "../admin/teacher-management";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone } from "lucide-react";

export function MentorList() {
    const { userRole, loading: authLoading } = useAuth();
    const [mentors, setMentors] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (userRole !== 'student') {
            setLoading(false);
            return;
        }

        setLoading(true);
        // Simplified query to avoid needing a composite index.
        const q = query(collection(db, "teachers"), where("status", "==", "Active"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teachersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
            // Sort the data client-side
            teachersData.sort((a, b) => a.name.localeCompare(b.name));
            setMentors(teachersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching mentors:", error);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [userRole, authLoading]);
    
    return (
        <div className="space-y-6">
             <div>
                <h1 className="font-headline text-3xl font-bold">Faculty Directory</h1>
                <p className="text-muted-foreground">
                    Contact faculty for guidance and support.
                </p>
            </div>

            {loading || authLoading ? (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                    ))}
                </div>
            ) : userRole === 'student' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {mentors.length > 0 ? mentors.map(mentor => (
                        <Card key={mentor.id} className="shadow-md flex flex-col">
                            <CardHeader className="items-center text-center">
                                <Avatar className="h-24 w-24 mb-4">
                                    <AvatarImage src={mentor.photoURL} alt={mentor.name} data-ai-hint="person face" />
                                    <AvatarFallback>{mentor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <CardTitle>{mentor.name}</CardTitle>
                                <CardDescription>{mentor.designation}</CardDescription>
                            </CardHeader>
                             <CardContent className="flex-grow text-center">
                                <p className="text-sm text-muted-foreground">{mentor.department}</p>
                            </CardContent>
                            <CardFooter className="flex-col gap-4">
                                <div className="flex justify-center gap-4 text-muted-foreground">
                                    {mentor.email && (
                                        <a href={`mailto:${mentor.email}`} className="hover:text-primary p-2 rounded-full hover:bg-accent" aria-label="Email mentor">
                                            <Mail className="h-5 w-5" />
                                        </a>
                                    )}
                                    {mentor.phone && (
                                        <a href={`tel:${mentor.phone}`} className="hover:text-primary p-2 rounded-full hover:bg-accent" aria-label="Call mentor">
                                            <Phone className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-16 border-dashed border-2 rounded-lg">
                            <h3 className="font-headline text-2xl font-semibold">No Mentors Available</h3>
                            <p className="text-muted-foreground">There are currently no active teachers available for mentorship.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-16 border-dashed border-2 rounded-lg">
                    <h3 className="font-headline text-2xl font-semibold">Feature Not Available</h3>
                    <p className="text-muted-foreground">This faculty directory is available for students.</p>
                </div>
            )}
        </div>
    );
}
