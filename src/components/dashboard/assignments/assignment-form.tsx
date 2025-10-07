
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { collection, onSnapshot, DocumentData, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SemesterGroup extends DocumentData {
    id: string;
    groupId: string;
}

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description is required."),
  dueDate: z.date({ required_error: "A due date is required."}),
  groupId: z.string().min(1, "You must select a group."),
  subject: z.string().min(2, "Subject is required."),
  fileURL: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  googleFormLink: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
});

export type AssignmentFormValues = z.infer<typeof formSchema>;

interface AssignmentFormProps {
  onSubmit: (values: AssignmentFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function AssignmentForm({ onSubmit, isSubmitting }: AssignmentFormProps) {
  
  const [groups, setGroups] = useState<SemesterGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DocumentData | null>(null);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      groupId: "",
      subject: "",
      fileURL: "",
      googleFormLink: "",
    },
  });

  useEffect(() => {
    const q = query(collection(db, "semesterGroups"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SemesterGroup));
        setGroups(groupsData);
    });
    return () => unsubscribe();
  }, []);

  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    setSelectedGroup(group || null);
    form.setValue("groupId", groupId);
    form.setValue("subject", ""); // Reset subject when group changes
  };

  const handleFormSubmit = async (values: AssignmentFormValues) => {
    await onSubmit(values);
    form.reset();
    setSelectedGroup(null);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
        <div className="space-y-6 px-1 max-h-[75vh] overflow-y-auto pr-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment Title</FormLabel>
              <FormControl><Input placeholder="e.g., Data Structures Mid-Term" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
           <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Detailed instructions for the assignment..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="groupId" render={({ field }) => (
            <FormItem>
              <FormLabel>Target Group</FormLabel>
              <Select onValueChange={handleGroupChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a semester group" /></SelectTrigger></FormControl>
                <SelectContent>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.groupId.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          {selectedGroup && (
             <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                <FormLabel>Subject</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger></FormControl>
                    <SelectContent>
                    {selectedGroup.subjects.map((sub: string) => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />
          )}

           <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
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
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
           )} />
           
           <FormField control={form.control} name="fileURL" render={({ field }) => (
            <FormItem>
              <FormLabel>Question File URL (Optional)</FormLabel>
              <FormControl><Input placeholder="https://example.com/questions.pdf" {...field} /></FormControl>
              <FormDescription>Link to a PDF or document with questions.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
           <FormField control={form.control} name="googleFormLink" render={({ field }) => (
            <FormItem>
              <FormLabel>Google Form Link (Optional)</FormLabel>
              <FormControl><Input placeholder="https://forms.gle/your-form" {...field} /></FormControl>
              <FormDescription>Link for quiz-based submissions.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Assignment"}</Button>
        </div>
      </form>
    </Form>
  );
}
