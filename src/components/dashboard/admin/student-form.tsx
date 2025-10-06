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
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { StudentData } from "./student-management";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Degree } from "./degree-management";
import { Stream } from "./stream-management";
import { Batch } from "./batch-management";

const formSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  reg_no: z.string().min(1, "Registration number is required."),
  degree: z.string().min(1, "Degree is required."),
  stream: z.string().min(1, "Stream is required."),
  batch: z.string().min(1, "Batch is required."),
  start_year: z.coerce.number().min(2000),
  end_year: z.coerce.number().min(2000),
});

export type StudentFormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  onSubmit: (values: StudentFormValues, studentId?: string) => Promise<void>;
  isSubmitting: boolean;
  existingStudentData?: StudentData | null;
}

export function StudentForm({ onSubmit, isSubmitting, existingStudentData }: StudentFormProps) {
  const { toast } = useToast();
  const isEditMode = !!existingStudentData;
  
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    const unsubDegrees = onSnapshot(collection(db, 'degrees'), snapshot => {
      setDegrees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Degree)));
    });
    const unsubStreams = onSnapshot(collection(db, 'streams'), snapshot => {
      setStreams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stream)));
    });
    const unsubBatches = onSnapshot(collection(db, 'batches'), snapshot => {
      setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch)));
    });

    return () => {
      unsubDegrees();
      unsubStreams();
      unsubBatches();
    }
  }, []);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      reg_no: "",
      degree: "",
      stream: "",
      batch: "",
      start_year: new Date().getFullYear(),
      end_year: new Date().getFullYear() + 4,
    },
  });

  useEffect(() => {
    if (existingStudentData) {
      form.reset({
        name: existingStudentData.name,
        email: existingStudentData.email,
        phone: existingStudentData.phone,
        reg_no: existingStudentData.reg_no,
        degree: existingStudentData.degree,
        stream: existingStudentData.stream,
        batch: existingStudentData.batch_id,
        start_year: existingStudentData.start_year,
        end_year: existingStudentData.end_year,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        reg_no: "",
        degree: "",
        stream: "",
        batch: "",
        start_year: new Date().getFullYear(),
        end_year: new Date().getFullYear() + 4,
      });
    }
  }, [existingStudentData, form]);


  const handleFormSubmit = async (values: StudentFormValues) => {
    try {
      await onSubmit(values, existingStudentData?.id);
      if (!isEditMode) {
        form.reset();
      }
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };
  
  const watchedDegree = form.watch("degree");


  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8 py-4"
      >
        <div className="space-y-4 px-1 max-h-[75vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Priya Sharma" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="e.g., priya.sharma@student.college.edu"
                    {...field}
                    disabled={isEditMode}
                  />
                </FormControl>
                <FormDescription>The student will use this to log in. Cannot be changed after creation.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 9876543210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="reg_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2024001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="degree"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Degree</FormLabel>
                <Select onValueChange={(value) => { field.onChange(value); form.setValue('stream', ''); }} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a degree" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {degrees.map(degree => (
                      <SelectItem key={degree.id} value={degree.id}>{degree.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="stream"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stream</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={!watchedDegree}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stream" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                     {streams
                      .filter(s => s.degreeId === watchedDegree)
                      .map(stream => (
                        <SelectItem key={stream.id} value={stream.id}>{stream.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="batch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {batches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>{batch.batch_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="start_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Year</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="end_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Year</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 2028" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Student Profile")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
