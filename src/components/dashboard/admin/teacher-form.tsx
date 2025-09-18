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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  teacherId: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").optional(),
  department: z.string().min(1, "Department is required."),
  subjects: z.string().min(1, "At least one subject is required."),
  semesters: z.string().optional(),
  years: z.string().optional(),
  salary: z.string().refine((val) => !isNaN(parseFloat(val)), { message: "Salary must be a number."}).optional(),
  gender: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z.enum(["Active", "Retired", "Transferred"]),
});

export type TeacherFormValues = z.infer<typeof formSchema>;

interface TeacherFormProps {
  onSubmit: (values: TeacherFormValues) => Promise<void>;
  defaultValues?: Partial<TeacherFormValues>;
  isEditing?: boolean;
}

export function TeacherForm({ onSubmit, defaultValues, isEditing = false }: TeacherFormProps) {
  const { toast } = useToast();
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "Active",
      ...defaultValues,
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
        <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-6 pr-6">
                <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Teacher ID</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., TCHR001" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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
                            <Input type="email" placeholder="e.g., amit.sharma@college.edu" {...field} disabled={isEditing} />
                        </FormControl>
                        <FormDescription>
                          Login email cannot be changed after creation.
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
                              <SelectValue placeholder="Select teacher status" />
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
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., +91-9876543210" {...field} />
                        </FormControl>
                         <FormDescription>
                            Used for generating initial password. Must be at least 10 digits.
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
                            <Input placeholder="e.g., CSE" {...field} />
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
                            <Input placeholder="e.g., Data Structures, Algorithms" {...field} />
                        </FormControl>
                        <FormDescription>
                            Enter subjects separated by a comma.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="semesters"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Semesters Taught</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 3, 5" {...field} />
                        </FormControl>
                         <FormDescription>
                            Enter semester numbers separated by a comma.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="years"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Years Taught</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 2, 3" {...field} />
                        </FormControl>
                        <FormDescription>
                            Enter year numbers separated by a comma.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Salary</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 60000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Male" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="joiningDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Joining Date</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
