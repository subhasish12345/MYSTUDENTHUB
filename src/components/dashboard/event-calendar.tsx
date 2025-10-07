"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Button } from '../ui/button';
import { PlusCircle, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EventForm, EventFormValues } from './events/event-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { createEvent, updateEvent, deleteEvent } from './events/actions';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
    createdBy: string;
}

export function EventCalendar() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [categoryFilter, setCategoryFilter] = useState('All');

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
        if (!user || !userRole) {
            toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingEvent) {
                await updateEvent(editingEvent.id, values);
                toast({ title: "Success", description: "Event has been updated." });
            } else {
                await createEvent({ ...values, createdBy: user.uid, authorRole: userRole });
                toast({ title: "Success", description: "New event has been created." });
            }
            setIsSheetOpen(false);
            setEditingEvent(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async () => {
        if (!deletingEvent) return;
        try {
            await deleteEvent(deletingEvent.id);
            toast({ title: "Success", description: "Event has been deleted."});
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive"});
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
        return events.filter(event => {
            if (categoryFilter === 'All') return true;
            return event.category === categoryFilter;
        });
    }, [events, categoryFilter]);

    const eventsOnSelectedDate = useMemo(() => {
        if (!date) return [];
        return filteredEvents.filter(event => format(event.date.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
    }, [filteredEvents, date]);

    return (
        <>
        <div className="space-y-6">
             <div>
                <h1 className="font-headline text-3xl font-bold">Events Calendar</h1>
                <p className="text-muted-foreground">Stay updated with all campus events.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center">
                           <div>
                                <CardTitle className="font-headline">Calendar</CardTitle>
                                <CardDescription>Select a date to view events.</CardDescription>
                            </div>
                           <div className="flex gap-2">
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
                            {isAdmin && (
                                <Button onClick={handleCreateClick}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Event
                                </Button>
                            )}
                           </div>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border"
                                modifiers={{
                                    hasEvent: events.map(e => e.date.toDate())
                                }}
                                modifiersStyles={{
                                    hasEvent: { 
                                        fontWeight: 'bold', 
                                        textDecoration: 'underline',
                                        textDecorationColor: 'hsl(var(--accent))',
                                        textUnderlineOffset: '0.2rem',
                                        textDecorationThickness: '0.15rem'
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                         <CardHeader>
                            <CardTitle className="font-headline">
                                Events on {date ? format(date, 'MMMM d') : 'selected date'}
                            </CardTitle>
                            <CardDescription>
                                {eventsOnSelectedDate.length} event(s) scheduled.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                             {eventsOnSelectedDate.length > 0 ? (
                                    eventsOnSelectedDate.map(event => (
                                        <Card key={event.id} className="shadow-md">
                                            {event.imageUrl && (
                                                <div className="relative h-32 w-full">
                                                    <Image src={event.imageUrl} alt={event.title} fill objectFit="cover" className="rounded-t-lg" data-ai-hint="event poster" />
                                                </div>
                                            )}
                                            <CardHeader>
                                                <CardTitle className='text-lg'>{event.title}</CardTitle>
                                                <div className='flex justify-between items-center'>
                                                    <CardDescription>{event.venue}</CardDescription>
                                                    <Badge variant={event.status === 'Cancelled' ? 'destructive' : 'secondary'}>{event.category}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground">{event.description}</p>
                                                {event.status === 'Cancelled' && <p className="text-destructive font-bold mt-2">This event has been cancelled.</p>}
                                            </CardContent>
                                            <CardFooter className="flex justify-between">
                                                {event.registrationLink && (
                                                    <Button asChild size="sm">
                                                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                                                            Register <ExternalLink className="ml-2 h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                {isAdmin && (
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(event)}><Edit className="h-4 w-4" /></Button>
                                                        <Button variant="destructive" size="sm" onClick={() => setDeletingEvent(event)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    ))
                            ) : (
                                <p className="text-muted-foreground text-sm h-40 flex items-center justify-center">No events scheduled for this day.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
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
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
