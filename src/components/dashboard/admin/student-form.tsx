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
import { useEffect } from "react";
import type { StudentData } from "./student-management";

const formSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  reg_no: z.string().min(1, "Registration number is required."),
  degree: z.string().min(2, "Degree is required."),
  stream: z.string().min(2, "Stream is required."),
  batch: z.string().min(4, "Batch is required, e.g., 2022-2026."),
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

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      reg_no: "",
      degree: "B.Tech",
      stream: "Computer Science",
      batch: "2024-2028",
      start_year: new Date().getFullYear(),
      end_year: new Date().getFullYear() + 4,
    },
  });

  useEffect(() => {
    if (existingStudentData) {
      form.reset(existingStudentData);
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
                <FormControl>
                  <Input placeholder="e.g., B.Tech" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input placeholder="e.g., Computer Science" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input placeholder="e.g., 2024-2028" {...field} />
                </FormControl>
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
