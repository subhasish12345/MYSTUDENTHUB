"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import type { Portal } from './portal-list';

const portalCategories = ['Academic', 'Scholarship', 'Internship', 'Career', 'College', 'Other'];

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  url: z.string().url("Must be a valid URL."),
  imageUrl: z.string().url("Must be a valid image URL.").optional().or(z.literal('')),
  category: z.string().min(1, "Please select a category."),
});

export type PortalFormValues = z.infer<typeof formSchema>;

interface PortalFormProps {
  onSubmit: (values: PortalFormValues) => Promise<void>;
  isSubmitting: boolean;
  existingData?: Portal | null;
}

export function PortalForm({ onSubmit, isSubmitting, existingData }: PortalFormProps) {
  const isEditMode = !!existingData;

  const form = useForm<PortalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      imageUrl: "",
      category: "",
    },
  });

  useEffect(() => {
    if (existingData) {
      form.reset(existingData);
    } else {
      form.reset({
        title: "",
        description: "",
        url: "",
        imageUrl: "",
        category: "",
      });
    }
  }, [existingData, form]);

  const handleFormSubmit = async (values: PortalFormValues) => {
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
                        <FormLabel>Portal Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., National Scholarship Portal" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://scholarships.gov.in/" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea placeholder="A short description of the portal and its purpose." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="https://example.com/image.png" {...field} />
                        </FormControl>
                        <FormDescription>A representative image for the portal card.</FormDescription>
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
                                {portalCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Portal")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
