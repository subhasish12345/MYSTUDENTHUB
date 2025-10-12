
"use client";

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, DocumentData, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LostAndFoundForm, LostAndFoundFormValues } from './lost-and-found-form';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export interface LostAndFoundItem extends DocumentData {
    id: string;
    title: string;
    description: string;
    location: string;
    imageUrl: string;
    status: 'lost' | 'found';
    authorId: string;
    authorName: string;
    createdAt: any;
}


export function LostAndFoundBoard() {
    const { user, userData, userRole, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [items, setItems] = useState<LostAndFoundItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<LostAndFoundItem | null>(null);

    useEffect(() => {
        const q = query(collection(db, "lostAndFoundItems"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LostAndFoundItem));
            setItems(itemsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching lost and found items: ", error);
            toast({ title: "Error", description: "Could not fetch items.", variant: "destructive" });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [toast]);

    const handleFormSubmit = async (values: LostAndFoundFormValues, imageDataUrl: string | null) => {
        if (!user || !userData) {
            toast({ title: "Please log in", description: "You must be logged in to post an item.", variant: "destructive" });
            return;
        }

        let imageUrl = '';
        if (imageDataUrl) {
            try {
                const storageRef = ref(storage, `lost-and-found/${user.uid}-${Date.now()}`);
                const uploadResult = await uploadString(storageRef, imageDataUrl, 'data_url');
                imageUrl = await getDownloadURL(uploadResult.ref);
            } catch (error: any) {
                toast({ title: "Image Upload Failed", description: error.message, variant: "destructive"});
                return;
            }
        }
        
        const itemData = {
            ...values,
            imageUrl,
            authorId: user.uid,
            authorName: userData.name,
            createdAt: serverTimestamp(),
        };

        addDoc(collection(db, "lostAndFoundItems"), itemData)
            .then(() => {
                toast({ title: "Success", description: "Your item has been posted." });
                setIsSheetOpen(false);
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: 'lostAndFoundItems',
                    operation: 'create',
                    requestResourceData: itemData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };
    
    const handleDeleteConfirm = async () => {
        if (!deletingItem) return;
        
        // Authorization check
        if (userRole !== 'admin' && user?.uid !== deletingItem.authorId) {
             toast({ title: "Permission Denied", description: "You can only delete your own posts.", variant: "destructive"});
             setDeletingItem(null);
             return;
        }

        try {
            await deleteDoc(doc(db, "lostAndFoundItems", deletingItem.id));
            toast({ title: "Success", description: "Item has been removed."});
        } catch (error: any) {
             toast({ title: "Deletion Failed", description: error.message, variant: "destructive"});
        } finally {
            setDeletingItem(null);
        }
    };

    const lostItems = items.filter(item => item.status === 'lost');
    const foundItems = items.filter(item => item.status === 'found');
    
    return (
        <>
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Lost & Found</h1>
                        <p className="text-muted-foreground">Find what's lost, report what's found.</p>
                    </div>
                     <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                             <Button disabled={authLoading} className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Report an Item
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl w-full">
                            <SheetHeader>
                                <SheetTitle>Report a Lost or Found Item</SheetTitle>
                                <SheetDescription>
                                    Fill in the details below. Take a picture if you can!
                                </SheetDescription>
                            </SheetHeader>
                            <LostAndFoundForm onSubmit={handleFormSubmit} />
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <section>
                        <h2 className="font-headline text-2xl font-bold mb-4 text-center">Lost Items</h2>
                        <div className="space-y-4">
                             {loading ? (
                                Array.from({length: 2}).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
                            ) : lostItems.length > 0 ? (
                                lostItems.map(item => (
                                    <ItemCard key={item.id} item={item} onDelete={() => setDeletingItem(item)} canDelete={userRole === 'admin' || user?.uid === item.authorId} />
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground pt-8">No lost items reported yet.</p>
                            )}
                        </div>
                    </section>
                     <section>
                        <h2 className="font-headline text-2xl font-bold mb-4 text-center">Found Items</h2>
                         <div className="space-y-4">
                            {loading ? (
                                Array.from({length: 2}).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
                            ) : foundItems.length > 0 ? (
                                foundItems.map(item => (
                                     <ItemCard key={item.id} item={item} onDelete={() => setDeletingItem(item)} canDelete={userRole === 'admin' || user?.uid === item.authorId} />
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground pt-8">No found items reported yet.</p>
                            )}
                        </div>
                    </section>
                </div>

            </div>
             <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this post. This action cannot be undone.</AlertDialogDescription>
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


function ItemCard({ item, onDelete, canDelete }: { item: LostAndFoundItem, onDelete: () => void, canDelete: boolean }) {
    return (
        <div className="bg-card text-card-foreground rounded-lg shadow-md overflow-hidden relative">
            {canDelete && (
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white hover:text-white" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
             <div className="relative h-64 w-full bg-muted">
                <Image src={item.imageUrl} alt={item.title} layout="fill" objectFit="cover" data-ai-hint="found item" />
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                    Last seen at: <span className="font-semibold text-foreground">{item.location}</span>
                </p>
                <p className="mt-2 text-sm">{item.description}</p>
                <div className="text-xs text-muted-foreground mt-4 pt-2 border-t">
                    Posted by {item.authorName} - {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </div>
            </div>
        </div>
    )
}
