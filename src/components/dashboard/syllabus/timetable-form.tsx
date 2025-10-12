"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const periodSchema = z.object({
    time: z.string().min(1, "Time is required."),
    subject: z.string().min(1, "Subject is required.")
});

const formSchema = z.object({
    monday: z.array(periodSchema),
    tuesday: z.array(periodSchema),
    wednesday: z.array(periodSchema),
    thursday: z.array(periodSchema),
    friday: z.array(periodSchema),
    saturday: z.array(periodSchema).optional(),
});

type TimetableFormValues = z.infer<typeof formSchema>;

const daysOfWeek: (keyof TimetableFormValues)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function TimetableForm({ group }: { group: any }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<TimetableFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: []
        },
    });

    useEffect(() => {
        const fetchTimetable = async () => {
            if (!group) return;
            setIsLoading(true);
            try {
                const timetableRef = doc(db, "timetables", group.id);
                const timetableSnap = await getDoc(timetableRef);
                if (timetableSnap.exists()) {
                    form.reset(timetableSnap.data() as TimetableFormValues);
                } else {
                    form.reset({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [] });
                }
            } catch (error) {
                toast({ title: "Error", description: "Could not fetch existing timetable.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchTimetable();
    }, [group, form, toast]);

    const onSubmit = async (values: TimetableFormValues) => {
        setIsSubmitting(true);
        try {
            const timetableRef = doc(db, "timetables", group.id);
            await setDoc(timetableRef, {
                ...values,
                groupId: group.id,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            toast({ title: "Success", description: `Timetable for ${group.groupId.replace(/_/g, ' ')} has been saved.` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
            {daysOfWeek.map(day => <Skeleton key={day} className="h-48 w-full" />)}
        </div>
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {daysOfWeek.map((day) => (
                        <DayCard key={day} day={day} form={form} />
                    ))}
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Timetable"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function DayCard({ day, form }: { day: keyof TimetableFormValues, form: any }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: day as any,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="capitalize">{day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-end">
                        <FormField
                            control={form.control}
                            name={`${day}.${index}.time`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="sr-only">Time</FormLabel>
                                    <FormControl><Input placeholder="e.g., 9-10 AM" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`${day}.${index}.subject`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="sr-only">Subject</FormLabel>
                                    <FormControl><Input placeholder="e.g., Physics" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append({ time: "", subject: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Period
                </Button>
            </CardContent>
        </Card>
    );
}
