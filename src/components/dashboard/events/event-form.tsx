"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect } from "react";
import type { Event } from "../event-calendar";

const eventCategories = ['Cultural', 'Technical', 'Sports', 'Academic', 'Workshop', 'Other'];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description is required."),
  date: z.date({ required_error: "A date is required."}),
  venue: z.string().min(3, "Venue is required."),
  category: z.string().min(1, "Category is required."),
  status: z.enum(['Scheduled', 'Cancelled']),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  registrationLink: z.string().url("Must be a valid URL for registration.").optional().or(z.literal('')),
});

export type EventFormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  onSubmit: (values: EventFormValues) => Promise<void>;
  isSubmitting: boolean;
  existingData?: Event | null;
}

export function EventForm({ onSubmit, isSubmitting, existingData }: EventFormProps) {
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      venue: "",
      category: "",
      status: "Scheduled",
      imageUrl: "",
      registrationLink: "",
    },
  });

  useEffect(() => {
    if (existingData) {
      form.reset({
        ...existingData,
        date: existingData.date.toDate(), // Convert Firestore Timestamp to JS Date
      });
    } else {
      form.reset({
        title: "",
        description: "",
        date: new Date(),
        venue: "",
        category: "",
        status: "Scheduled",
        imageUrl: "",
        registrationLink: "",
      });
    }
  }, [existingData, form]);


  const handleFormSubmit = async (values: EventFormValues) => {
    await onSubmit(values);
    if (!existingData) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
        <div className="space-y-6 px-1 max-h-[75vh] overflow-y-auto pr-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl><Input placeholder="e.g., Annual Tech Fest 2024" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Detailed information about the event..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
           <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Event Date</FormLabel>
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
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date("1900-01-01")}
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
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                <SelectContent>
                  {eventCategories.filter(c => c !== 'All').map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
               <FormDescription>You can cancel an event by changing its status.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
           <FormField control={form.control} name="imageUrl" render={({ field }) => (
            <FormItem>
              <FormLabel>Poster Image URL (Optional)</FormLabel>
              <FormControl><Input placeholder="https://example.com/poster.png" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
           <FormField control={form.control} name="registrationLink" render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Link (Optional)</FormLabel>
              <FormControl><Input placeholder="https://forms.gle/your-form" {...field} /></FormControl>
              <FormDescription>A link to a Google Form or other registration page.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : (existingData ? "Save Changes" : "Create Event")}</Button>
        </div>
      </form>
    </Form>
  );
}
