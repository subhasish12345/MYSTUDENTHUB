"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ExternalLink, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EventForm, EventFormValues } from './event-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { createEvent, updateEvent, deleteEvent } from './actions';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

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
                await updateEvent(editingEvent.id, values);
                toast({ title: "Success", description: "Event has been updated." });
            } else {
                await createEvent({ ...values, postedBy: user.uid, postedByName: userData.name, authorRole: userRole });
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
            await deleteEvent(deletingEvent.id);
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                 {loading || authLoading ? (
                    Array.from({length: 4}).map((_, i) => (
                        <Card key={i} className="flex flex-col">
                            <Skeleton className="h-40 w-full rounded-t-lg" />
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3 mt-2" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-10 w-24" />
                            </CardFooter>
                        </Card>
                    ))
                 ) : filteredEvents.length > 0 ? (
                        filteredEvents.map(event => (
                            <Card key={event.id} className="flex flex-col shadow-md">
                                {event.imageUrl && (
                                    <div className="relative h-40 w-full">
                                        <Image src={event.imageUrl} alt={event.title} fill style={{objectFit: "cover"}} className="rounded-t-lg" data-ai-hint="event poster" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className='flex-1'>
                                            <CardTitle className='text-lg'>{event.title}</CardTitle>
                                            <CardDescription>{format(event.date.toDate(), 'PPP, p')}</CardDescription>
                                        </div>
                                        <Badge variant={event.status === 'Cancelled' ? 'destructive' : 'secondary'}>{event.category}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-2">
                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                    <p className="text-sm font-semibold">Venue: {event.venue}</p>
                                    {event.status === 'Cancelled' && <p className="text-destructive font-bold">This event has been cancelled.</p>}
                                </CardContent>
                                <CardFooter className="flex justify-between items-center border-t pt-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <UserCircle className="h-4 w-4" />
                                        <span>{event.postedByName || "Admin"}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {event.registrationLink && event.status !== 'Cancelled' && (
                                            <Button asChild size="sm">
                                                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                                                    Register <ExternalLink className="ml-2 h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                        {isAdmin && (
                                            <>
                                                <Button variant="outline" size="icon" onClick={() => handleEditClick(event)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="destructive" size="icon" onClick={() => setDeletingEvent(event)}><Trash2 className="h-4 w-4" /></Button>
                                            </>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                ) : (
                    <div className="lg:col-span-3 xl:col-span-4 text-center py-16 border-dashed border-2 rounded-lg">
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
