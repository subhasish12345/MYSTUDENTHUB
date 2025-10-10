"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where, getDoc, doc } from "firebase/firestore";
import { UserData } from "../admin/teacher-management";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare } from "lucide-react";
import { DirectMessagePanel } from "./direct-message-panel";
import { StudentData } from "../admin/student-management";


export function MentorList() {
    const { user, userRole } = useAuth();
    const [mentors, setMentors] = useState<UserData[]>([]);
    const [conversations, setConversations] = useState<any[]>([]); // For teachers to see their conversations
    const [loading, setLoading] = useState(true);
    const [selectedMentor, setSelectedMentor] = useState<UserData | null>(null);

    useEffect(() => {
        // Only fetch teachers, not all users. This prevents admins from showing up.
        const q = query(collection(db, "users"), where("role", "==", "teacher"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teachersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
            setMentors(teachersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching mentors:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
     // If the user is a teacher, fetch their existing conversations
    useEffect(() => {
        if (userRole !== 'teacher' || !user) return;
        
        const q = query(collection(db, "directMessages"), where("participants", "array-contains", user.uid));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const convos = await Promise.all(snapshot.docs.map(async docSnap => {
                const data = docSnap.data();
                const studentId = data.participants.find((p: string) => p !== user.uid);
                if (!studentId) return null; // Should not happen in a 2-person chat
                const studentDoc = await getDoc(doc(db, "students", studentId));
                return studentDoc.exists() ? { id: studentId, ...studentDoc.data() } as StudentData : null;
            }));
            setConversations(convos.filter(Boolean));
        });
        
        return () => unsubscribe();

    }, [user, userRole]);


    const handleSelectConversation = (participant: UserData | StudentData) => {
        // In this context, the 'mentor' is the other participant in the chat
        setSelectedMentor(participant as UserData);
    };
    
    if (selectedMentor) {
        return <DirectMessagePanel mentor={selectedMentor} onBack={() => setSelectedMentor(null)} />;
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="font-headline text-3xl font-bold">Mentor Connect</h1>
                <p className="text-muted-foreground">
                    {userRole === 'student' ? 'Connect with faculty for guidance and support.' : 'View and manage your conversations with students.'}
                </p>
            </div>

            {loading ? (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                    ))}
                </div>
            ) : userRole === 'student' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {mentors.map(mentor => (
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
                                 <Button className="w-full" onClick={() => setSelectedMentor(mentor)}>
                                    <MessageSquare className="mr-2 h-4 w-4"/> Message
                                </Button>
                                <div className="flex justify-center gap-4 text-muted-foreground">
                                    {mentor.email && <a href={`mailto:${mentor.email}`} className="hover:text-primary"><Mail className="h-5 w-5" /></a>}
                                    {mentor.phone && <a href={`tel:${mentor.phone}`} className="hover:text-primary"><Phone className="h-5 w-5" /></a>}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : ( // Teacher's view of their conversations
                 <div className="space-y-4">
                     {conversations.length > 0 ? (
                         conversations.map(student => (
                            <Card key={student.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelectConversation(student)}>
                                <CardHeader className="flex flex-row items-center gap-4">
                                     <Avatar className="h-12 w-12">
                                        <AvatarImage src={student.photoURL} alt={student.name} data-ai-hint="person face" />
                                        <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle>{student.name}</CardTitle>
                                        <CardDescription>Click to view conversation</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                         ))
                     ) : (
                        <div className="text-center py-16 border-dashed border-2 rounded-lg">
                            <h3 className="font-headline text-2xl font-semibold">No Conversations Yet</h3>
                            <p className="text-muted-foreground">When a student sends you a message, it will appear here.</p>
                        </div>
                     )}
                 </div>
            )}
        </div>
    );
}
