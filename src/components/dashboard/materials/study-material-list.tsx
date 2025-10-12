"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, DocumentData, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Book } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MaterialForm, MaterialFormValues } from './material-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export interface StudyMaterial extends DocumentData {
    id: string;
    title: string;
    description: string;
    url: string;
    degreeId: string;
    streamId: string;
    semester: number;
    subject: string;
    createdAt: any;
    authorId: string;
    authorName: string;
}

export function StudyMaterialList() {
    const { user, userRole, userData, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [materials, setMaterials] = useState<StudyMaterial[]>([]);
    const [loading, setLoading] = useState(true);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
    const [deletingMaterial, setDeletingMaterial] = useState<StudyMaterial | null>(null);
    
    const [degrees, setDegrees] = useState<any[]>([]);
    const [streams, setStreams] = useState<any[]>([]);
    const [degreeMap, setDegreeMap] = useState<Record<string, string>>({});
    const [streamMap, setStreamMap] = useState<Record<string, string>>({});

    const canManage = userRole === 'admin' || userRole === 'teacher';

    useEffect(() => {
        // Fetch degrees and streams for mapping IDs to names
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

        // Fetch all study materials
        const materialsQuery = query(collection(db, "studyMaterials"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(materialsQuery, (snapshot) => {
            const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMaterial));
            setMaterials(materialsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching study materials: ", error);
            toast({ title: "Error", description: "Could not fetch study materials.", variant: "destructive" });
            setLoading(false);
        });
        
        return () => {
            unsubDegrees();
            unsubStreams();
            unsubscribe();
        };
    }, [toast]);
    
    const handleFormSubmit = async (values: MaterialFormValues) => {
        if (!user || !userData || !canManage) {
            toast({ title: "Permission Denied", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingMaterial) {
                await updateDoc(doc(db, "studyMaterials", editingMaterial.id), {
                    ...values,
                    updatedAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "Material has been updated." });
            } else {
                await addDoc(collection(db, "studyMaterials"), {
                    ...values,
                    authorId: user.uid,
                    authorName: userData.name,
                    createdAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "New material has been added." });
            }
            setIsSheetOpen(false);
            setEditingMaterial(null);
        } catch (error: any) {
            toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingMaterial || !canManage) {
            toast({ title: "Permission Denied", variant: "destructive" });
            setDeletingMaterial(null);
            return;
        }
        try {
            await deleteDoc(doc(db, "studyMaterials", deletingMaterial.id));
            toast({ title: "Success", description: "Material has been deleted."});
        } catch (error: any) {
            toast({ title: "Deletion Failed", description: error.message, variant: "destructive"});
        } finally {
            setDeletingMaterial(null);
        }
    };

    const handleCreateClick = () => {
        setEditingMaterial(null);
        setIsSheetOpen(true);
    };

    const handleEditClick = (material: StudyMaterial) => {
        setEditingMaterial(material);
        setIsSheetOpen(true);
    };

    const organizedMaterials = useMemo(() => {
        const grouped: any = {};
        const relevantMaterials = userRole === 'student' && userData
            ? materials.filter(m => m.degreeId === userData.degree && m.streamId === userData.stream)
            : materials;

        relevantMaterials.forEach(material => {
            const degreeName = degreeMap[material.degreeId] || 'Unknown Degree';
            const streamName = streamMap[material.streamId] || 'Unknown Stream';
            const semester = `Semester ${material.semester}`;
            const subject = material.subject;

            if (!grouped[degreeName]) grouped[degreeName] = {};
            if (!grouped[degreeName][streamName]) grouped[degreeName][streamName] = {};
            if (!grouped[degreeName][streamName][semester]) grouped[degreeName][streamName][semester] = {};
            if (!grouped[degreeName][streamName][semester][subject]) grouped[degreeName][streamName][semester][subject] = [];
            
            grouped[degreeName][streamName][semester][subject].push(material);
        });
        return grouped;
    }, [materials, degreeMap, streamMap, userRole, userData]);

    if (authLoading || loading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Study Materials</h1>
                        <p className="text-muted-foreground">Download notes, presentations, and books for your courses.</p>
                    </div>
                    {canManage && (
                        <Button onClick={handleCreateClick} disabled={authLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Material
                        </Button>
                    )}
                </div>

                {Object.keys(organizedMaterials).length > 0 ? (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {Object.keys(organizedMaterials).map(degreeName => (
                            <AccordionItem key={degreeName} value={degreeName} className="border rounded-lg bg-card">
                                <AccordionTrigger className="p-6 font-headline text-xl">
                                    {degreeName}
                                </AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <Accordion type="multiple" className="w-full space-y-2">
                                        {Object.keys(organizedMaterials[degreeName]).map(streamName => (
                                            <AccordionItem key={streamName} value={streamName} className="border-t">
                                                <AccordionTrigger className="py-4 font-semibold">{streamName}</AccordionTrigger>
                                                <AccordionContent className="pb-4">
                                                    <Accordion type="multiple" className="w-full space-y-1">
                                                        {Object.keys(organizedMaterials[degreeName][streamName]).sort().map(semester => (
                                                            <AccordionItem key={semester} value={semester} className="border-t">
                                                                <AccordionTrigger className="py-3 text-sm">{semester}</AccordionTrigger>
                                                                <AccordionContent className="pt-2 pl-4">
                                                                    {Object.keys(organizedMaterials[degreeName][streamName][semester]).map(subject => (
                                                                        <div key={subject} className="mb-4">
                                                                            <h4 className="font-semibold text-muted-foreground mb-2">{subject}</h4>
                                                                            <div className="space-y-2">
                                                                                {organizedMaterials[degreeName][streamName][semester][subject].map((material: StudyMaterial) => (
                                                                                    <div key={material.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                                                                        <a href={material.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary hover:underline">
                                                                                            <Book className="h-4 w-4" />
                                                                                            <span className="font-medium">{material.title}</span>
                                                                                        </a>
                                                                                        {canManage && (
                                                                                            <div className="flex gap-2">
                                                                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(material)}><Edit className="h-4 w-4" /></Button>
                                                                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingMaterial(material)}><Trash2 className="h-4 w-4" /></Button>
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
                        <h3 className="font-headline text-2xl font-semibold">No Materials Yet</h3>
                        <p className="text-muted-foreground">
                            {canManage ? "Click 'Add Material' to upload the first document." : "Study materials for your courses will appear here."}
                        </p>
                    </div>
                )}
            </div>
            
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-2xl w-full">
                    <SheetHeader>
                        <SheetTitle>{editingMaterial ? 'Edit Material' : 'Add New Study Material'}</SheetTitle>
                        <SheetDescription>Fill in the details and provide a link to the material.</SheetDescription>
                    </SheetHeader>
                    <MaterialForm 
                        onSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                        existingData={editingMaterial}
                        degrees={degrees}
                        streams={streams}
                    />
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!deletingMaterial} onOpenChange={() => setDeletingMaterial(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the material link. This action cannot be undone.</AlertDialogDescription>
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
