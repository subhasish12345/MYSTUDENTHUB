"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import type { Syllabus } from './syllabus-viewer';
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, onSnapshot, query } from "firebase/firestore";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  url: z.string().url("Must be a valid URL."),
  degreeId: z.string().min(1, "Please select a degree."),
  streamId: z.string().min(1, "Please select a stream."),
  semester: z.coerce.number().min(1).max(12),
  subject: z.string().min(2, "Subject is required."),
});

export type SyllabusFormValues = z.infer<typeof formSchema>;

interface SyllabusFormProps {
  onSubmit: (values: SyllabusFormValues) => Promise<void>;
  isSubmitting: boolean;
  existingData?: Syllabus | null;
}

export function SyllabusForm({ onSubmit, isSubmitting, existingData }: SyllabusFormProps) {
  const isEditMode = !!existingData;
  
  const [degrees, setDegrees] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  const form = useForm<SyllabusFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: "",
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
    const unsubDegrees = onSnapshot(collection(db, "degrees"), (snapshot) => {
        setDegrees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubStreams = onSnapshot(collection(db, "streams"), (snapshot) => {
        setStreams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
        unsubDegrees();
        unsubStreams();
    };
  }, []);

  useEffect(() => {
    if (existingData) {
      form.reset({
          ...existingData,
          semester: existingData.semester || 1,
      });
    } else {
      form.reset({ title: "", url: "", degreeId: "", streamId: "", semester: 1, subject: "" });
    }
  }, [existingData, form]);

  useEffect(() => {
    const fetchSubjects = async () => {
        if (!watchedDegree || !watchedStream || !watchedSemester) {
            setSubjects([]);
            return;
        }
        
        try {
            // Simplified subject fetching. For a real app, this should come from a curriculum collection.
             const q = query(collection(db, "semesterGroups"));
             const querySnapshot = await getDocs(q);
             let foundSubjects = new Set<string>();
             querySnapshot.forEach(doc => {
                 const data = doc.data();
                 if(data.degreeId === watchedDegree && data.streamId === watchedStream && data.semester === watchedSemester) {
                     data.subjects?.forEach((sub: string) => foundSubjects.add(sub));
                 }
             });

            if (foundSubjects.size > 0) {
                setSubjects(Array.from(foundSubjects));
            } else {
                 const commonSubjects = ["Introduction to Programming", "Data Structures", "Algorithms", "Database Management Systems", "Operating Systems", "Computer Networks", "Software Engineering"];
                 setSubjects(commonSubjects);
            }

        } catch (e) {
            console.error("Could not fetch subjects. Using fallback.", e);
            const commonSubjects = ["Introduction to Programming", "Data Structures", "Algorithms", "Database Management Systems", "Operating Systems", "Computer Networks", "Software Engineering"];
            setSubjects(commonSubjects);
        }
    };
    fetchSubjects();
}, [watchedDegree, watchedStream, watchedSemester, degrees, streams]);


  const handleFormSubmit = async (values: SyllabusFormValues) => {
    await onSubmit(values);
    if (!isEditMode) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
        <div className="space-y-6 px-1 max-h-[75vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                    <FormLabel>Syllabus Title</FormLabel>
                    <FormControl><Input placeholder="e.g., B.Tech CSE Semester 5 Syllabus" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                    <FormLabel>Syllabus PDF URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/syllabus.pdf" {...field} /></FormControl>
                    <FormDescription>Link to the PDF document.</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />
            
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
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Syllabus")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
