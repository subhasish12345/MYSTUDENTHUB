"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect } from "react";
import type { Event } from './event-calendar';

const eventCategories = ['Cultural', 'Technical', 'Sports', 'Academic', 'Workshop', 'Other'];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  date: z.date({ required_error: "An event date is required."}),
  venue: z.string().min(3, "Venue is required."),
  category: z.string().min(1, "Please select a category."),
  status: z.enum(['Scheduled', 'Cancelled']),
  registrationLink: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
});

export type EventFormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  onSubmit: (values: EventFormValues) => Promise<void>;
  isSubmitting: boolean;
  existingData?: Event | null;
}

export function EventForm({ onSubmit, isSubmitting, existingData }: EventFormProps) {
  const isEditMode = !!existingData;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: "",
        description: "",
        venue: "",
        category: "",
        status: 'Scheduled',
        registrationLink: "",
        imageUrl: "",
    },
  });

  useEffect(() => {
    if (existingData) {
      form.reset({
        ...existingData,
        date: existingData.date.toDate(),
      });
    } else {
        form.reset({
            title: "",
            description: "",
            date: new Date(),
            venue: "",
            category: "",
            status: 'Scheduled',
            registrationLink: "",
            imageUrl: "",
        });
    }
  }, [existingData, form]);

  const handleFormSubmit = async (values: EventFormValues) => {
    await onSubmit(values);
    if (!isEditMode) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
        <div className="space-y-6 px-1 max-h-[75vh] overflow-y-auto pr-4">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Annual Tech Fest 'Innovate 2024'" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Event Date & Time</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? format(field.value, "PPP, p") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="venue" render={({ field }) => (
                 <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl><Input placeholder="e.g., Main Auditorium" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {eventCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Describe the event, its purpose, guests, etc." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="imageUrl" render={({ field }) => (
                 <FormItem>
                    <FormLabel>Event Image URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://example.com/poster.jpg" {...field} /></FormControl>
                    <FormDescription>Link to a poster or promotional image for the event.</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="registrationLink" render={({ field }) => (
                 <FormItem>
                    <FormLabel>Registration Link (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://forms.gle/your-form" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            {isEditMode && <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />}
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Event")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
