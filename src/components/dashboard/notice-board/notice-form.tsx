
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
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Degree } from "../admin/degree-management";
import { Stream } from "../admin/stream-management";
import { Batch } from "../admin/batch-management";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description is required."),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  targetType: z.enum(['global', 'degree', 'stream', 'batch']),
  degree: z.string().optional(),
  stream: z.string().optional(),
  batch: z.string().optional(),
}).refine(data => data.targetType !== 'degree' || !!data.degree, {
    message: "Degree is required for this target type.", path: ["degree"]
}).refine(data => data.targetType !== 'stream' || !!data.stream, {
    message: "Stream is required for this target type.", path: ["stream"]
}).refine(data => data.targetType !== 'batch' || !!data.batch, {
    message: "Batch is required for this target type.", path: ["batch"]
});

export type NoticeFormValues = z.infer<typeof formSchema>;

interface NoticeFormProps {
  onSubmit: (values: NoticeFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function NoticeForm({ onSubmit, isSubmitting }: NoticeFormProps) {
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      targetType: 'global',
    },
  });

  useEffect(() => {
    const unsubDegrees = onSnapshot(collection(db, 'degrees'), snapshot => setDegrees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Degree))));
    const unsubStreams = onSnapshot(collection(db, 'streams'), snapshot => setStreams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stream))));
    const unsubBatches = onSnapshot(collection(db, 'batches'), snapshot => setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch))));
    return () => { unsubDegrees(); unsubStreams(); unsubBatches(); };
  }, []);

  const watchedTargetType = form.watch("targetType");
  const watchedDegree = form.watch("degree");
  
  const filteredStreams = streams.filter(s => s.degreeId === watchedDegree);

  const handleFormSubmit = async (values: NoticeFormValues) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
        <div className="space-y-6 px-1 max-h-[75vh] overflow-y-auto pr-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Notice Title</FormLabel>
              <FormControl><Input placeholder="e.g., Mid-Term Exam Schedule" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
           <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Detailed information about the notice..." {...field} /></FormControl>
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
           <FormField control={form.control} name="targetType" render={({ field }) => (
            <FormItem>
              <FormLabel>Target Audience</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="global">Global (All Users)</SelectItem>
                  <SelectItem value="degree">Specific Degree</SelectItem>
                  <SelectItem value="stream">Specific Stream</SelectItem>
                  <SelectItem value="batch">Specific Batch</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Who should see this notice?</FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          {watchedTargetType === 'degree' || watchedTargetType === 'stream' || watchedTargetType === 'batch' ? (
            <FormField control={form.control} name="degree" render={({ field }) => (
                <FormItem>
                <FormLabel>Degree</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a degree"/></SelectTrigger></FormControl>
                    <SelectContent>{degrees.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />
          ) : null}

          {watchedTargetType === 'stream' || watchedTargetType === 'batch' ? (
            <FormField control={form.control} name="stream" render={({ field }) => (
                <FormItem>
                <FormLabel>Stream</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchedDegree}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a stream"/></SelectTrigger></FormControl>
                    <SelectContent>{filteredStreams.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />
          ) : null}

           {watchedTargetType === 'batch' ? (
            <FormField control={form.control} name="batch" render={({ field }) => (
                <FormItem>
                <FormLabel>Batch</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a batch"/></SelectTrigger></FormControl>
                    <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batch_name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />
          ) : null}

        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Posting..." : "Post Notice"}</Button>
        </div>
      </form>
    </Form>
  );
}
