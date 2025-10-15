"use client";

import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, DocumentData, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { PortalForm, PortalFormValues } from './portal-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export interface Portal extends DocumentData {
    id: string;
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    category: string;
    createdAt: any;
    authorId: string;
    authorName: string;
}

export function PortalList() {
    const { user, userRole, userData, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [portals, setPortals] = useState<Portal[]>([]);
    const [loading, setLoading] = useState(true);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPortal, setEditingPortal] = useState<Portal | null>(null);
    const [deletingPortal, setDeletingPortal] = useState<Portal | null>(null);

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        const portalsQuery = query(collection(db, "portals"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(portalsQuery, (snapshot) => {
            const portalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Portal));
            setPortals(portalsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching portals: ", error);
            toast({ title: "Error", description: "Could not fetch important portals.", variant: "destructive" });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [toast]);

    const handleFormSubmit = async (values: PortalFormValues) => {
        if (!user || !userData || !isAdmin) {
            toast({ title: "Permission Denied", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingPortal) {
                await updateDoc(doc(db, "portals", editingPortal.id), {
                    ...values,
                    updatedAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "Portal has been updated." });
            } else {
                await addDoc(collection(db, "portals"), {
                    ...values,
                    authorId: user.uid,
                    authorName: userData.name,
                    createdAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "New portal has been added." });
            }
            setIsSheetOpen(false);
            setEditingPortal(null);
        } catch (error: any) {
            toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingPortal || !isAdmin) {
            toast({ title: "Permission Denied", variant: "destructive" });
            setDeletingPortal(null);
            return;
        }
        try {
            await deleteDoc(doc(db, "portals", deletingPortal.id));
            toast({ title: "Success", description: "Portal has been deleted."});
        } catch (error: any) {
            toast({ title: "Deletion Failed", description: error.message, variant: "destructive"});
        } finally {
            setDeletingPortal(null);
        }
    };

    const handleCreateClick = () => {
        setEditingPortal(null);
        setIsSheetOpen(true);
    };

    const handleEditClick = (portal: Portal) => {
        setEditingPortal(portal);
        setIsSheetOpen(true);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Important Portals</h1>
                        <p className="text-muted-foreground">A curated list of important websites and resources.</p>
                    </div>
                    {isAdmin && (
                        <Button onClick={handleCreateClick} disabled={authLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Portal
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)
                    ) : portals.length > 0 ? (
                        portals.map(portal => (
                            <Card key={portal.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="p-0">
                                    <div className="relative h-40 w-full">
                                        <Image 
                                            src={portal.imageUrl || `https://picsum.photos/seed/${portal.id}/400/200`} 
                                            alt={portal.title} 
                                            fill
                                            className="object-cover"
                                            data-ai-hint="website screenshot"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="font-headline text-lg mb-2">{portal.title}</CardTitle>
                                    <CardDescription className="text-sm">{portal.description}</CardDescription>
                                </CardContent>
                                <CardFooter className="p-4 bg-muted/50 flex justify-between items-center">
                                    <Button asChild variant="default">
                                        <a href={portal.url} target="_blank" rel="noopener noreferrer">
                                            Visit Now <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                    {isAdmin && (
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(portal)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingPortal(portal)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 border-dashed border-2 rounded-lg">
                            <h3 className="font-headline text-2xl font-semibold">No Portals Added Yet</h3>
                            <p className="text-muted-foreground">
                                {isAdmin ? "Click 'Add Portal' to share the first resource." : "Important portals will appear here when added by an admin."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-full">
                    <SheetHeader>
                        <SheetTitle>{editingPortal ? 'Edit Portal' : 'Add New Portal'}</SheetTitle>
                        <SheetDescription>Fill in the details for the website link.</SheetDescription>
                    </SheetHeader>
                    <PortalForm 
                        onSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                        existingData={editingPortal}
                    />
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!deletingPortal} onOpenChange={() => setDeletingPortal(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the portal link. This action cannot be undone.</AlertDialogDescription>
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