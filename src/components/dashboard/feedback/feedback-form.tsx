"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { submitFeedback } from './actions';
import { UserData } from '../admin/teacher-management';

const formSchema = z.object({
  feedbackType: z.enum(['Faculty', 'Event'], { required_error: 'You must select a feedback type.' }),
  subjectId: z.string().min(1, 'You must select a subject for feedback.'),
  rating: z.number().min(1, 'Please provide a rating.').max(5),
  comment: z.string().min(10, 'Please provide a comment of at least 10 characters.'),
  isAnonymous: z.boolean().default(false),
});

type FeedbackFormValues = z.infer<typeof formSchema>;

export function FeedbackForm() {
    const { user, userData, loading: authLoading, userRole } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [teachers, setTeachers] = useState<UserData[]>([]);
    const [events, setEvents] = useState<DocumentData[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            feedbackType: 'Faculty',
            subjectId: '',
            rating: 0,
            comment: '',
            isAnonymous: false,
        },
    });

    const feedbackType = form.watch('feedbackType');

    useEffect(() => {
        const fetchSubjects = async () => {
            setLoadingSubjects(true);
            try {
                if (feedbackType === 'Faculty') {
                    const teachersQuery = query(collection(db, 'teachers'), orderBy('name', 'asc'));
                    const teachersSnap = await getDocs(teachersQuery);
                    setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData)));
                } else { // Event
                    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));
                    const eventsSnap = await getDocs(eventsQuery);
                    setEvents(eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }
            } catch (error) {
                toast({ title: 'Error', description: 'Could not load faculty or event list.', variant: 'destructive' });
            } finally {
                setLoadingSubjects(false);
            }
        };

        if (userRole === 'student') {
            fetchSubjects();
        }
    }, [feedbackType, toast, userRole]);
    
    if (authLoading) {
        return <p>Loading...</p>;
    }
    
    if (userRole !== 'student') {
        return (
            <div className="text-center py-16 border-dashed border-2 rounded-lg">
                <h3 className="font-headline text-2xl font-semibold">Access Denied</h3>
                <p className="text-muted-foreground">
                    Only students can submit feedback.
                </p>
            </div>
        );
    }

    const onSubmit = async (values: FeedbackFormValues) => {
        if (!user || !userData) {
            toast({ title: 'Error', description: 'You must be logged in to submit feedback.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const subjectList = feedbackType === 'Faculty' ? teachers : events;
            const subject = subjectList.find(s => s.id === values.subjectId);
            
            await submitFeedback({
                ...values,
                subjectName: subject?.title || subject?.name || 'Unknown',
                submittedBy: values.isAnonymous ? 'anonymous' : user.uid,
                studentName: values.isAnonymous ? 'Anonymous' : userData.name,
            });

            toast({ title: 'Thank You!', description: 'Your feedback has been submitted successfully.' });
            router.push('/dashboard');
        } catch (error: any) {
            toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Submit Feedback</h1>
                <p className="text-muted-foreground">Your feedback is valuable for improving our community.</p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>New Feedback Form</CardTitle>
                            <CardDescription>All submissions are reviewed by the administration.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <FormField
                                control={form.control}
                                name="feedbackType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>What are you providing feedback on?</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    form.setValue('subjectId', ''); // Reset subject on type change
                                                }}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="Faculty" /></FormControl>
                                                    <FormLabel className="font-normal">Faculty Member</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="Event" /></FormControl>
                                                    <FormLabel className="font-normal">Campus Event</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="subjectId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select {feedbackType === 'Faculty' ? 'Faculty Member' : 'Event'}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingSubjects}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingSubjects ? 'Loading...' : `Select a ${feedbackType.toLowerCase()}...`} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(feedbackType === 'Faculty' ? teachers : events).map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name || item.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="rating"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Overall Rating</FormLabel>
                                        <FormControl>
                                             <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={cn(
                                                            "h-8 w-8 cursor-pointer transition-colors",
                                                            star <= field.value ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                                                        )}
                                                        onClick={() => field.onChange(star)}
                                                    />
                                                ))}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="comment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Feedback / Comment</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Please provide detailed feedback. What did you like? What could be improved?"
                                                rows={6}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isAnonymous"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Submit Anonymously</FormLabel>
                                            <FormDescription>
                                                If you check this, your name will not be attached to this feedback.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Feedback
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
