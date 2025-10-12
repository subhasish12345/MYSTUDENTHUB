"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, DocumentData, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ExternalLink, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EventForm, EventFormValues } from './event-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EventCard } from './event-card';

export interface Event extends DocumentData {
    id: string;
    title: string;
    description: string;
    date: any; // Stored as Firestore Timestamp
    venue: string;
    registrationLink?: string;
    imageUrl?: string;
    category: string;
    status: 'Scheduled' | 'Cancelled';
    postedBy: string;
    postedByName: string;
    authorRole: string;
}

export function EventCalendar() {
    const { user, userRole, userData, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');


    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

    const isAdmin = userRole === 'admin';
    const eventCategories = ['All', 'Cultural', 'Technical', 'Sports', 'Academic', 'Workshop', 'Other'];

    useEffect(() => {
        const eventsQuery = query(collection(db, "events"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
            setEvents(eventsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching events: ", error);
            toast({ title: "Error", description: "Could not fetch events.", variant: "destructive" });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [toast]);

    const handleFormSubmit = async (values: EventFormValues) => {
        if (!user || !userData || !userRole || userRole !== 'admin') {
            toast({ title: "Permission Denied", description: "Only admins can create or edit events.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingEvent) {
                await updateDoc(doc(db, "events", editingEvent.id), {
                    ...values,
                    updatedAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "Event has been updated." });
            } else {
                await addDoc(collection(db, "events"), {
                    ...values,
                    postedBy: user.uid,
                    postedByName: userData.name,
                    authorRole: userRole,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "New event has been created." });
            }
            setIsSheetOpen(false);
            setEditingEvent(null);
        } catch (error: any) {
            toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (!deletingEvent || !userRole || userRole !== 'admin') {
            toast({ title: "Permission Denied", description: "Only admins can delete events.", variant: "destructive" });
            setDeletingEvent(null);
            return;
        }

        try {
            await deleteDoc(doc(db, "events", deletingEvent.id));
            toast({ title: "Success", description: "Event has been deleted."});
        } catch (error: any) {
            toast({ title: "Deletion Failed", description: error.message, variant: "destructive"});
        } finally {
            setDeletingEvent(null);
        }
    };
    
    const handleCreateClick = () => {
        setEditingEvent(null);
        setIsSheetOpen(true);
    }
    
    const handleEditClick = (event: Event) => {
        setEditingEvent(event);
        setIsSheetOpen(true);
    }

    const filteredEvents = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        return events.filter(event => {
            const eventDate = event.date.toDate();
            let timeMatch = false;
            if (timeFilter === 'upcoming') {
                timeMatch = eventDate >= now;
            } else if (timeFilter === 'past') {
                timeMatch = eventDate < now;
            } else { // 'all'
                timeMatch = true;
            }

            const categoryMatch = categoryFilter === 'All' || event.category === categoryFilter;
            
            return timeMatch && categoryMatch;
        }).sort((a,b) => timeFilter === 'past' ? b.date.toMillis() - a.date.toMillis() : a.date.toMillis() - b.date.toMillis());
    }, [events, categoryFilter, timeFilter]);


    return (
        <>
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Events Calendar</h1>
                    <p className="text-muted-foreground">Stay updated with all campus events.</p>
                </div>
                {isAdmin && (
                    <Button onClick={handleCreateClick} disabled={authLoading}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Event
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle className="font-headline">Filter Events</CardTitle>
                            <CardDescription>Select filters to narrow down the events shown below.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Select value={timeFilter} onValueChange={(val) => setTimeFilter(val as any)}>
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="past">Past</SelectItem>
                                    <SelectItem value="all">All Events</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {eventCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                   </div>
                </CardHeader>
            </Card>

            <div className="flex flex-wrap gap-8 justify-center group">
                 {loading || authLoading ? (
                    Array.from({length: 4}).map((_, i) => (
                        <div key={i} className="w-80 h-80">
                           <Skeleton className="h-full w-full rounded-full" />
                        </div>
                    ))
                 ) : filteredEvents.length > 0 ? (
                        filteredEvents.map(event => (
                            <EventCard 
                                key={event.id}
                                event={event}
                                isAdmin={isAdmin}
                                onEdit={() => handleEditClick(event)}
                                onDelete={() => setDeletingEvent(event)}
                            />
                        ))
                ) : (
                    <div className="w-full text-center py-16 border-dashed border-2 rounded-lg">
                        <h3 className="font-headline text-2xl font-semibold">No Events Found</h3>
                        <p className="text-muted-foreground">There are no events matching your current filters.</p>
                    </div>
                )}
            </div>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="sm:max-w-xl w-full">
                <SheetHeader>
                    <SheetTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</SheetTitle>
                    <SheetDescription>
                        {editingEvent ? 'Update the details for this event.' : 'Fill in the details to create a new event.'}
                    </SheetDescription>
                </SheetHeader>
                <EventForm 
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                    existingData={editingEvent}
                />
            </SheetContent>
        </Sheet>
        <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete the event. This action cannot be undone.</AlertDialogDescription>
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
