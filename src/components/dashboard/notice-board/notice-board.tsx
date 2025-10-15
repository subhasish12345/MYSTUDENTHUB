
"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, DocumentData, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, where, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, UserCircle, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { NoticeForm, NoticeFormValues } from './notice-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export interface Notice extends DocumentData {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: any;
    updatedAt?: any;
    authorId: string;
    authorName: string;
    authorRole: string;
}

export function NoticeBoard() {
    const { user, userRole, userData, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('All');

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [deletingNotice, setDeletingNotice] = useState<Notice | null>(null);

    const canManage = userRole === 'admin' || userRole === 'teacher';
    const noticeCategories = ['All', 'Academics', 'Examination', 'Cultural', 'Hostel', 'Administrative', 'Other'];

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const noticesQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(noticesQuery, (snapshot) => {
            const noticesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
            setNotices(noticesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notices: ", error);
            toast({ title: "Error", description: "Could not fetch notices.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast, user]);

    const handleFormSubmit = async (values: NoticeFormValues) => {
        if (!user || !userData || !userRole || !canManage) {
            toast({ title: "Permission Denied", description: "You do not have permission to perform this action.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingNotice) {
                await updateDoc(doc(db, "notices", editingNotice.id), {
                    ...values,
                    updatedAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "Notice has been updated." });
            } else {
                await addDoc(collection(db, "notices"), {
                    ...values,
                    authorId: user.uid,
                    authorName: userData.name,
                    authorRole: userRole,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "New notice has been posted." });

                const studentsQuery = query(collection(db, "users"), where("role", "==", "student"));
                const studentsSnap = await getDocs(studentsQuery);
                const batch = writeBatch(db);
                studentsSnap.forEach(studentDoc => {
                    const notificationRef = doc(collection(db, "users", studentDoc.id, "notifications"));
                    batch.set(notificationRef, {
                        title: `New Notice: ${values.title}`,
                        body: values.content.substring(0, 100),
                        link: "/dashboard/notice-board",
                        isRead: false,
                        createdAt: serverTimestamp(),
                    });
                });
                await batch.commit();
            }
            setIsSheetOpen(false);
            setEditingNotice(null);
        } catch (error: any) {
            toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (!deletingNotice || !canManage) {
            toast({ title: "Permission Denied", variant: "destructive" });
            setDeletingNotice(null);
            return;
        }

        try {
            await deleteDoc(doc(db, "notices", deletingNotice.id));
            toast({ title: "Success", description: "Notice has been deleted."});
        } catch (error: any) {
            toast({ title: "Deletion Failed", description: error.message, variant: "destructive"});
        } finally {
            setDeletingNotice(null);
        }
    };
    
    const handleCreateClick = () => {
        setEditingNotice(null);
        setIsSheetOpen(true);
    }
    
    const handleEditClick = (notice: Notice) => {
        setEditingNotice(notice);
        setIsSheetOpen(true);
    }

    const filteredNotices = useMemo(() => {
        return notices.filter(notice => categoryFilter === 'All' || notice.category === categoryFilter);
    }, [notices, categoryFilter]);

    return (
        <>
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="font-headline text-3xl font-bold">Notice Board</h1>
                        <p className="text-muted-foreground">Latest announcements and updates.</p>
                    </div>
                    {canManage && (
                        <Button onClick={handleCreateClick} disabled={authLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Notice
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-end">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[220px]">
                                    <SelectValue placeholder="Filter by category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {noticeCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                       </div>
                    </CardHeader>
                </Card>

                <div className="flex flex-wrap justify-center md:justify-start gap-8">
                     {loading || authLoading ? (
                        Array.from({length: 4}).map((_, i) => (
                             <div key={i} className="pixar-card h-[280px]">
                                <Skeleton className="h-full w-full" />
                             </div>
                        ))
                     ) : filteredNotices.length > 0 ? (
                            filteredNotices.map(notice => (
                                <Dialog key={notice.id}>
                                    <div className="pixar-card h-[280px]">
                                        <div className="card-header-pixar">
                                            <div className="card-avatar"><UserCircle className="w-8 h-8" /></div>
                                            <p className="card-username">{notice.authorName}</p>
                                        </div>
                                        <div className="card-content-area flex-grow">
                                            <h3 className="card-title-pixar">{notice.title}</h3>
                                            <p className="card-caption line-clamp-2">{notice.content}</p>
                                        </div>
                                        <div className="card-actions">
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="ghost" className="action-button"><Eye className="action-button-icon" /> View</Button>
                                            </DialogTrigger>
                                            {canManage && (
                                                <>
                                                <button className="action-button" aria-label="Edit Post" onClick={() => handleEditClick(notice)}>
                                                    <Edit className="action-button-icon" />
                                                    <span>Edit</span>
                                                </button>
                                                <button className="action-button delete-button" aria-label="Delete Post" onClick={() => setDeletingNotice(notice)}>
                                                    <Trash2 className="action-button-icon" />
                                                    <span>Delete</span>
                                                </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{notice.title}</DialogTitle>
                                            <DialogDescription>
                                                Posted by {notice.authorName} about {formatDistanceToNow(notice.createdAt.toDate(), { addSuffix: true })}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 whitespace-pre-wrap">{notice.content}</div>
                                    </DialogContent>
                                </Dialog>
                            ))
                    ) : (
                        <div className="w-full text-center py-16 border-dashed border-2 rounded-lg">
                            <h3 className="font-headline text-2xl font-semibold">No Notices Found</h3>
                            <p className="text-muted-foreground">There are no notices matching your current filters.</p>
                        </div>
                    )}
                </div>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-2xl w-full">
                    <SheetHeader>
                        <SheetTitle>{editingNotice ? 'Edit Notice' : 'Create New Notice'}</SheetTitle>
                        <SheetDescription>
                            {editingNotice ? 'Update the details for this notice.' : 'Fill in the details to post a new notice.'}
                        </SheetDescription>
                    </SheetHeader>
                    <NoticeForm 
                        onSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                        existingData={editingNotice}
                    />
                </SheetContent>
            </Sheet>
            <AlertDialog open={!!deletingNotice} onOpenChange={() => setDeletingNotice(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this notice. This action cannot be undone.</AlertDialogDescription>
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
