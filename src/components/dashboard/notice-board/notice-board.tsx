

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, DocumentData, getDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rss } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { NoticeForm, NoticeFormValues } from "./notice-form";
import { NoticeList } from "./notice-list";
import { useToast } from "@/hooks/use-toast";
import { createNotice } from "./actions";
import { StudentData } from "../admin/student-management";


export interface Notice extends DocumentData {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    postedBy: string;
    postedByName: string;
    target: {
        type: 'global' | 'degree' | 'stream' | 'batch' | 'group';
        degree?: string;
        stream?: string;
        batch?: string;
        groupId?: string;
    };
    createdAt: any;
}


export function NoticeBoard() {
    const { user, userRole, userData } = useAuth();
    const { toast } = useToast();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studentData, setStudentData] = useState<StudentData | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch student data if the user is a student
                if (userRole === 'student') {
                    const studentDocRef = doc(db, "students", user.uid);
                    const studentDoc = await getDoc(studentDocRef);
                    if (studentDoc.exists()) {
                        setStudentData(studentDoc.data() as StudentData);
                    }
                }

                // Set up the real-time listener for notices
                const noticesQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"));
                const unsubscribe = onSnapshot(noticesQuery, (snapshot) => {
                    const noticesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
                    setNotices(noticesData);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching notices: ", error);
                    toast({ title: "Error", description: "Could not fetch notices. Check permissions.", variant: "destructive" });
                    setLoading(false);
                });
                
                return unsubscribe;
            } catch (error) {
                console.error("Error setting up notice board:", error);
                toast({ title: "Setup Error", description: "Could not initialize notice board.", variant: "destructive" });
                setLoading(false);
            }
        };

        const unsubscribePromise = fetchInitialData();

        return () => {
            unsubscribePromise.then(unsubscribe => {
                if (unsubscribe) {
                    unsubscribe();
                }
            });
        };
    }, [user, userRole, toast]);


    const handleCreateNotice = async (values: NoticeFormValues) => {
        if (!user || !userRole || !userData) {
            toast({ title: "Error", description: "You must be logged in to post a notice.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            await createNotice({
                ...values,
                postedBy: user.uid,
                postedByName: userData.name || "User"
            });
            toast({ title: "Success!", description: "Notice has been posted." });
            setIsSheetOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const filteredNotices = notices.filter(notice => {
        if (userRole === 'admin') return true; // Admins see all
        if (notice.target.type === 'global') return true;

        if (userRole === 'student' && studentData) {
            const { degree, stream, batch_id } = studentData;
            const target = notice.target;
            if (target.type === 'degree' && target.degree === degree) return true;
            if (target.type === 'stream' && target.degree === degree && target.stream === stream) return true;
            if (target.type === 'batch' && target.degree === degree && target.stream === stream && target.batch === batch_id) return true;
        }
        
        // A simple rule for teachers to see all non-student-specific notices
        if(userRole === 'teacher') return true;

        return false;
    });


    const canCreateNotice = userRole === 'admin' || userRole === 'teacher';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                        <Rss className="h-8 w-8 text-primary" />
                        Notice Board
                    </h1>
                    <p className="text-muted-foreground">Latest announcements and updates.</p>
                </div>
                {canCreateNotice && (
                    <Button onClick={() => setIsSheetOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Notice
                    </Button>
                )}
            </div>

            <NoticeList notices={filteredNotices} loading={loading} />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-2xl w-full">
                    <SheetHeader>
                        <SheetTitle>Create New Notice</SheetTitle>
                        <SheetDescription>
                            Post an announcement for students. You can target it to specific groups.
                        </SheetDescription>
                    </SheetHeader>
                    <NoticeForm onSubmit={handleCreateNotice} isSubmitting={isSubmitting} />
                </SheetContent>
            </Sheet>
        </div>
    );
}
