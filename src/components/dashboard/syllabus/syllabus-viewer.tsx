"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, DocumentData } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { createSyllabus, updateSyllabus, deleteSyllabus } from './actions';
import { SyllabusForm, SyllabusFormValues } from './syllabus-form';

export interface Syllabus extends DocumentData {
    id: string;
    title: string;
    url: string;
    degreeId: string;
    streamId: string;
    semester: number;
    subject: string;
    createdAt: any;
    authorId: string;
    authorName: string;
}

export function SyllabusViewer() {
    const { user, userRole, userData, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
    const [loading, setLoading] = useState(true);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingSyllabus, setEditingSyllabus] = useState<Syllabus | null>(null);
    const [deletingSyllabus, setDeletingSyllabus] = useState<Syllabus | null>(null);
    
    const [degrees, setDegrees] = useState<any[]>([]);
    const [streams, setStreams] = useState<any[]>([]);
    const [degreeMap, setDegreeMap] = useState<Record<string, string>>({});
    const [streamMap, setStreamMap] = useState<Record<string, string>>({});

    const canManage = userRole === 'admin';

    useEffect(() => {
        const unsubDegrees = onSnapshot(collection(db, "degrees"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDegrees(data);
            setDegreeMap(data.reduce((acc, curr) => ({...acc, [curr.id]: curr.name}), {}));
        });
        const unsubStreams = onSnapshot(collection(db, "streams"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStreams(data);
            setStreamMap(data.reduce((acc, curr) => ({...acc, [curr.id]: curr.name}), {}));
        });

        const syllabiQuery = query(collection(db, "syllabi"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(syllabiQuery, (snapshot) => {
            const syllabiData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Syllabus));
            setSyllabi(syllabiData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching syllabi: ", error);
            toast({ title: "Error", description: "Could not fetch syllabi.", variant: "destructive" });
            setLoading(false);
        });
        
        return () => {
            unsubDegrees();
            unsubStreams();
            unsubscribe();
        };
    }, [toast]);
    
    const handleFormSubmit = async (values: SyllabusFormValues) => {
        if (!user || !userData || !canManage) {
            toast({ title: "Permission Denied", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingSyllabus) {
                await updateSyllabus(editingSyllabus.id, values);
                toast({ title: "Success", description: "Syllabus has been updated." });
            } else {
                await createSyllabus({ ...values, authorId: user.uid, authorName: userData.name });
                toast({ title: "Success", description: "New syllabus has been added." });
            }
            setIsSheetOpen(false);
            setEditingSyllabus(null);
        } catch (error: any) {
            toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingSyllabus || !canManage) {
            toast({ title: "Permission Denied", variant: "destructive" });
            setDeletingSyllabus(null);
            return;
        }
        try {
            await deleteSyllabus(deletingSyllabus.id);
            toast({ title: "Success", description: "Syllabus has been deleted."});
        } catch (error: any) {
            toast({ title: "Deletion Failed", description: error.message, variant: "destructive"});
        } finally {
            setDeletingSyllabus(null);
        }
    };

    const handleCreateClick = () => {
        setEditingSyllabus(null);
        setIsSheetOpen(true);
    };

    const handleEditClick = (syllabus: Syllabus) => {
        setEditingSyllabus(syllabus);
        setIsSheetOpen(true);
    };

    const organizedSyllabi = useMemo(() => {
        const grouped: any = {};
        const relevantSyllabi = (userRole === 'student' || userRole === 'teacher') && userData
            ? syllabi.filter(m => m.degreeId === userData.degree && m.streamId === userData.stream)
            : syllabi;

        relevantSyllabi.forEach(syllabus => {
            const degreeName = degreeMap[syllabus.degreeId] || 'Unknown Degree';
            const streamName = streamMap[syllabus.streamId] || 'Unknown Stream';
            const semester = `Semester ${syllabus.semester}`;
            const subject = syllabus.subject;

            if (!grouped[degreeName]) grouped[degreeName] = {};
            if (!grouped[degreeName][streamName]) grouped[degreeName][streamName] = {};
            if (!grouped[degreeName][streamName][semester]) grouped[degreeName][streamName][semester] = {};
            if (!grouped[degreeName][streamName][semester][subject]) grouped[degreeName][streamName][semester][subject] = [];
            
            grouped[degreeName][streamName][semester][subject].push(syllabus);
        });
        return grouped;
    }, [syllabi, degreeMap, streamMap, userRole, userData]);

    if (authLoading || loading) {
        return (
             <div className="space-y-4 pt-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6 pt-6">
                 {canManage && (
                    <div className="flex justify-end">
                        <Button onClick={handleCreateClick} disabled={authLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Syllabus
                        </Button>
                    </div>
                )}

                {Object.keys(organizedSyllabi).length > 0 ? (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {Object.keys(organizedSyllabi).map(degreeName => (
                            <AccordionItem key={degreeName} value={degreeName} className="border rounded-lg bg-card">
                                <AccordionTrigger className="p-6 font-headline text-xl">
                                    {degreeName}
                                </AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <Accordion type="multiple" className="w-full space-y-2">
                                        {Object.keys(organizedSyllabi[degreeName]).map(streamName => (
                                            <AccordionItem key={streamName} value={streamName} className="border-t">
                                                <AccordionTrigger className="py-4 font-semibold">{streamName}</AccordionTrigger>
                                                <AccordionContent className="pb-4">
                                                    <Accordion type="multiple" className="w-full space-y-1">
                                                        {Object.keys(organizedSyllabi[degreeName][streamName]).sort().map(semester => (
                                                            <AccordionItem key={semester} value={semester} className="border-t">
                                                                <AccordionTrigger className="py-3 text-sm">{semester}</AccordionTrigger>
                                                                <AccordionContent className="pt-2 pl-4">
                                                                    {Object.keys(organizedSyllabi[degreeName][streamName][semester]).map(subject => (
                                                                        <div key={subject} className="mb-4">
                                                                            <h4 className="font-semibold text-muted-foreground mb-2">{subject}</h4>
                                                                            <div className="space-y-2">
                                                                                {organizedSyllabi[degreeName][streamName][semester][subject].map((syllabus: Syllabus) => (
                                                                                    <div key={syllabus.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                                                                        <a href={syllabus.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary hover:underline">
                                                                                            <Download className="h-4 w-4" />
                                                                                            <span className="font-medium">{syllabus.title}</span>
                                                                                        </a>
                                                                                        {canManage && (
                                                                                            <div className="flex gap-2">
                                                                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(syllabus)}><Edit className="h-4 w-4" /></Button>
                                                                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingSyllabus(syllabus)}><Trash2 className="h-4 w-4" /></Button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        ))}
                                                    </Accordion>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-16 border-dashed border-2 rounded-lg">
                        <h3 className="font-headline text-2xl font-semibold">No Syllabi Found</h3>
                        <p className="text-muted-foreground">
                            {canManage ? "Click 'Add Syllabus' to upload the first document." : "Syllabi for your courses will appear here."}
                        </p>
                    </div>
                )}
            </div>
            
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-2xl w-full">
                    <SheetHeader>
                        <SheetTitle>{editingSyllabus ? 'Edit Syllabus' : 'Add New Syllabus'}</SheetTitle>
                        <SheetDescription>Fill in the details and provide a link to the syllabus PDF.</SheetDescription>
                    </SheetHeader>
                    <SyllabusForm 
                        onSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                        existingData={editingSyllabus}
                    />
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!deletingSyllabus} onOpenChange={() => setDeletingSyllabus(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the syllabus link. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
