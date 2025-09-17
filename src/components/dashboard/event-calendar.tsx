"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { events } from "@/lib/placeholder-data";
import { format } from "date-fns";
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';

export function EventCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const selectedEvents = date ? events.filter(event => format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) : [];
    
    return (
        <div className="space-y-6">
             <div>
                <h1 className="font-headline text-3xl font-bold">Events Calendar</h1>
                <p className="text-muted-foreground">Stay updated with all campus events.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle className="font-headline">Calendar</CardTitle>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Event
                            </Button>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border"
                                modifiers={{
                                    hasEvent: events.map(e => e.date)
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
                                {selectedEvents.length} event(s) scheduled.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {selectedEvents.length > 0 ? (
                                <ul className="space-y-4">
                                    {selectedEvents.map(event => (
                                        <li key={event.id} className="p-3 rounded-lg bg-muted border">
                                            <p className="font-semibold">{event.title}</p>
                                            <p className="text-sm text-muted-foreground">{event.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-sm h-40 flex items-center justify-center">No events scheduled for this day.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
