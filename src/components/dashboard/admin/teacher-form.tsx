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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  department: z.string().min(2, "Department is required."),
  subjects: z.string().transform(val => val.split(',').map(s => s.trim())).refine(arr => arr.every(s => s.length > 0), "Subjects cannot be empty."),
  status: z.enum(['Active', 'Retired', 'Transferred']),
});

export type TeacherFormValues = z.infer<typeof formSchema>;

interface TeacherFormProps {
  onSubmit: (values: TeacherFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function TeacherForm({ onSubmit, isSubmitting }: TeacherFormProps) {
  const { toast } = useToast();
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        email: "",
        phone: "",
        department: "",
        subjects: [],
        status: "Active",
    }
  });

  const handleFormSubmit = async (values: TeacherFormValues) => {
    try {
      await onSubmit(values);
      form.reset();
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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
        <div className="space-y-6 px-1">
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Dr. Amit Sharma" {...field} />
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
                        <Input type="email" placeholder="e.g., amit.sharma@college.edu" {...field} />
                    </FormControl>
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
                     <FormDescription>
                        Used for generating the initial password.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Subjects</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., DSA, OS, DBMS" {...field} value={Array.isArray(field.value) ? field.value.join(', ') : ''} />
                    </FormControl>
                     <FormDescription>
                        Comma-separated list of subjects.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                            <SelectItem value="Transferred">Transferred</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Teacher Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
