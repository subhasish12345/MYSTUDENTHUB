"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import type { StudyMaterial } from './study-material-list';
import { db } from "@/lib/firebase";
import { collection, doc, getDoc } from "firebase/firestore";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL."),
  degreeId: z.string().min(1, "Please select a degree."),
  streamId: z.string().min(1, "Please select a stream."),
  semester: z.coerce.number().min(1).max(12),
  subject: z.string().min(2, "Subject is required."),
});

export type MaterialFormValues = z.infer<typeof formSchema>;

interface MaterialFormProps {
  onSubmit: (values: MaterialFormValues) => Promise<void>;
  isSubmitting: boolean;
  existingData?: StudyMaterial | null;
  degrees: any[];
  streams: any[];
}

export function MaterialForm({ onSubmit, isSubmitting, existingData, degrees, streams }: MaterialFormProps) {
  const isEditMode = !!existingData;
  const [subjects, setSubjects] = useState<string[]>([]);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: "",
        description: "",
        url: "",
        degreeId: "",
        streamId: "",
        semester: 1,
        subject: "",
    },
  });

  const watchedDegree = form.watch("degreeId");
  const watchedStream = form.watch("streamId");
  const watchedSemester = form.watch("semester");

  useEffect(() => {
    if (existingData) {
      form.reset({
          ...existingData,
          semester: existingData.semester || 1,
      });
    } else {
      form.reset({ title: "", description: "", url: "", degreeId: "", streamId: "", semester: 1, subject: "" });
    }
  }, [existingData, form]);

  useEffect(() => {
    const fetchSubjects = async () => {
        if (!watchedDegree || !watchedStream || !watchedSemester) {
            setSubjects([]);
            return;
        }
        
        // Find the first group that matches the criteria to pull subject list from.
        // This assumes subjects are consistent across sections of the same semester.
        const degree = degrees.find(d => d.id === watchedDegree);
        const stream = streams.find(s => s.id === watchedStream);

        if (!degree || !stream) return;

        // This is a simplification; in a real app, you might need a more robust way
        // to find all possible subjects for a semester without needing a batch.
        // For now, we'll try to find a group that matches. This may not always work
        // if no group for that combination exists yet.
        try {
            // A more robust way would be to have a collection of curriculums.
            // For now, let's assume we can find a group.
            // This is a placeholder as we can't query effectively without a batch.
            // Let's hardcode some common subjects as a fallback.
            const commonSubjects = ["Introduction to Programming", "Data Structures", "Algorithms", "Database Management Systems", "Operating Systems", "Computer Networks"];
            setSubjects(commonSubjects);

        } catch (e) {
            console.error("Could not fetch subjects. Using fallback.", e);
            const commonSubjects = ["Introduction to Programming", "Data Structures", "Algorithms", "Database Management Systems", "Operating Systems", "Computer Networks"];
            setSubjects(commonSubjects);
        }
    };
    fetchSubjects();
}, [watchedDegree, watchedStream, watchedSemester, degrees, streams]);


  const handleFormSubmit = async (values: MaterialFormValues) => {
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
                        <FormLabel>Title</FormLabel>
                        <FormControl><Input placeholder="e.g., Chapter 1: Introduction to AI" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Material URL</FormLabel>
                        <FormControl><Input placeholder="https://example.com/notes.pdf" {...field} /></FormControl>
                        <FormDescription>Link to the PDF, PPT, book, etc.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl><Textarea placeholder="A short description of the material." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="degreeId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Degree</FormLabel>
                        <Select onValueChange={(val) => { field.onChange(val); form.setValue('streamId', ''); }} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Degree" /></SelectTrigger></FormControl>
                            <SelectContent>{degrees.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="streamId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Stream / Branch</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!watchedDegree}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Stream" /></SelectTrigger></FormControl>
                            <SelectContent>{streams.filter(s => s.degreeId === watchedDegree).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="semester" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <FormControl><Input type="number" min="1" max="12" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={subjects.length === 0}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormDescription>If subjects are missing, ensure the curriculum is defined.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Material")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
