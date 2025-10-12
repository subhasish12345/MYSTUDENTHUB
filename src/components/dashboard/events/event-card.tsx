"use client"

import { Event } from './event-calendar';
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface EventCardProps {
    event: Event;
    isAdmin: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

export function EventCard({ event, isAdmin, onEdit, onDelete }: EventCardProps) {
    return (
        <div className="event-card-container">
            <div className="event-card">
                <div className="event-card-front">
                    <h3 className="event-card-front-title">{event.title}</h3>
                </div>
                <div className="event-card-back">
                    {event.imageUrl && (
                        <>
                           <Image src={event.imageUrl} alt={event.title} fill className="event-card-image" data-ai-hint="event poster" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                           <div className="event-card-overlay" />
                        </>
                    )}
                    <div className="event-card-back-content space-y-3">
                        <div>
                             <Badge variant={event.status === 'Cancelled' ? 'destructive' : 'secondary'}>{event.category}</Badge>
                             <h3 className="text-xl font-bold font-headline mt-1">{event.title}</h3>
                             <p className="text-xs text-white/80">{format(event.date.toDate(), 'PPP, p')}</p>
                        </div>
                        <p className="text-sm text-white/90">{event.description}</p>
                        <p className="text-sm font-semibold">Venue: {event.venue}</p>

                        <div className="flex justify-between items-center pt-2">
                             <div className="flex gap-2">
                                {event.registrationLink && event.status !== 'Cancelled' && (
                                    <Button asChild size="sm" variant="secondary">
                                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                                            Register <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={onEdit}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="destructive" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
