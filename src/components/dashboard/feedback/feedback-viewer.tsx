"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Feedback extends DocumentData {
    id: string;
    feedbackType: 'Faculty' | 'Event';
    subjectName: string;
    rating: number;
    comment: string;
    isAnonymous: boolean;
    studentName: string;
    createdAt: any; // Firestore Timestamp
}

export function FeedbackViewer() {
    const { toast } = useToast();
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const feedbackQuery = query(collection(db, "feedback"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
            setFeedbackList(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching feedback:", error);
            toast({ title: "Error", description: "Could not fetch feedback. Check permissions.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "h-4 w-4",
                            i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Feedback Submissions</CardTitle>
                <CardDescription>All feedback submitted by students is displayed here in reverse chronological order.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Comment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                </TableRow>
                            ))
                        ) : feedbackList.length > 0 ? (
                            feedbackList.map((feedback) => (
                                <TableRow key={feedback.id}>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {feedback.createdAt ? formatDistanceToNow(feedback.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={feedback.isAnonymous ? "secondary" : "outline"}>
                                            {feedback.studentName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{feedback.feedbackType}</TableCell>
                                    <TableCell className="font-medium">{feedback.subjectName}</TableCell>
                                    <TableCell>{renderStars(feedback.rating)}</TableCell>
                                    <TableCell className="text-muted-foreground">{feedback.comment}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No feedback has been submitted yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
