"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import type { Notice } from './notice-board';

const noticeCategories = ['Academics', 'Examination', 'Cultural', 'Hostel', 'Administrative', 'Other'];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  content: z.string().min(20, "Content must be at least 20 characters long."),
  category: z.string().min(1, "Please select a category."),
});

export type NoticeFormValues = z.infer<typeof formSchema>;

interface NoticeFormProps {
  onSubmit: (values: NoticeFormValues) => Promise<void>;
  isSubmitting: boolean;
  existingData?: Notice | null;
}

export function NoticeForm({ onSubmit, isSubmitting, existingData }: NoticeFormProps) {
  const isEditMode = !!existingData;

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: "",
        content: "",
        category: "",
    },
  });

  useEffect(() => {
    if (existingData) {
      form.reset(existingData);
    } else {
        form.reset({ title: "", content: "", category: "" });
    }
  }, [existingData, form]);

  const handleFormSubmit = async (values: NoticeFormValues) => {
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
                        <FormLabel>Notice Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Mid-Term Exam Schedule" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {noticeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Write the full content of the notice here..." {...field} rows={8} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "Saving..." : "Posting...") : (isEditMode ? "Save Changes" : "Post Notice")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
