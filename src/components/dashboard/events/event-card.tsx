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
        <div className="animated-event-card relative" data-title={event.title}>
            {event.imageUrl && (
                <Image 
                    src={event.imageUrl} 
                    alt={event.title} 
                    fill 
                    className="object-cover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    data-ai-hint="event poster"
                />
            )}
            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col justify-between h-full text-white">
                <div className="card-heading">
                    <Badge variant={event.status === 'Cancelled' ? 'destructive' : 'secondary'}>
                        {event.category}
                    </Badge>
                    <h3 className="text-xl font-bold font-headline mt-1">{event.title}</h3>
                    <p className="text-xs text-white/80">{format(event.date.toDate(), 'PPP, p')}</p>
                </div>
                
                <div className="card-content-wrapper text-sm">
                    <p>{event.description}</p>
                    <p className="font-semibold mt-2">Venue: {event.venue}</p>
                </div>

                <div className="card-buttons flex justify-between items-center">
                    <div>
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
    );
}
