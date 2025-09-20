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

const formSchema = z.object({
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  name: z.string().min(2, "Name must be at least 2 characters."),
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
        email: "",
        phone: "",
        name: ""
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
                    <FormDescription>
                        Used for generating the initial password.
                    </FormDescription>
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
                    <FormDescription>
                        The user will use this email to log in.
                    </FormDescription>
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
                        Used for generating initial password. Must be at least 10 digits.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
