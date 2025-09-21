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
import type { UserData } from "@/components/dashboard/admin/teacher-management";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

// Combine schemas for both students and teachers, making most fields optional
// as they will be conditionally rendered.
const formSchema = z.object({
  // Common fields
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  photoURL: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  bio: z.string().max(500, "Bio should be less than 500 characters.").optional(),
  
  // University fields
  campus: z.string().optional(),
  building: z.string().optional(),
  roomNo: z.string().optional(),
  
  // Social links
  linkedin: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  github: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  
  // Teacher-specific
  department: z.string().optional(),
  subjects: z.string().transform(val => val.split(',').map(s => s.trim()).filter(s => s.length > 0)).optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),

  // Student-specific
  degree: z.string().optional(),
  stream: z.string().optional(),
  gender: z.string().optional(),
  isHosteler: z.boolean().optional(),
  marks10th: z.coerce.number().optional(),
  marks12th: z.coerce.number().optional(),
});


export type ProfileFormValues = z.infer<typeof formSchema>;

interface EditProfileFormProps {
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  isSubmitting: boolean;
  existingData: UserData;
}

export function EditProfileForm({ onSubmit, isSubmitting, existingData }: EditProfileFormProps) {
  const { toast } = useToast();
  const isTeacher = existingData.role === 'teacher';
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (existingData) {
      form.reset({
        ...existingData,
        // Ensure array is converted to comma-separated string for the input
        subjects: Array.isArray(existingData.subjects) ? existingData.subjects.join(', ') : '',
      });
    }
  }, [existingData, form]);

  const handleFormSubmit = async (values: ProfileFormValues) => {
    try {
      await onSubmit(values);
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
        <div className="space-y-6 px-1 max-h-[75vh] overflow-y-auto pr-4">
             <h3 className="font-headline text-lg font-semibold">Basic Information</h3>
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl><Textarea placeholder="A short biography..." {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            {/* Teacher Specific Fields */}
            {isTeacher && <>
                <h3 className="font-headline text-lg font-semibold border-t pt-6">Professional Details</h3>
                 <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
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
                           <Input {...field} value={Array.isArray(field.value) ? field.value.join(', ') : field.value} />
                        </FormControl>
                        <FormDescription>Comma-separated list.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="qualification"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Qualification</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Specialization</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </>}

            {/* Student Specific Fields */}
            {!isTeacher && <>
                <h3 className="font-headline text-lg font-semibold border-t pt-6">Academic Details</h3>
                 <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Degree</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
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
                        <FormControl><Input {...field} /></FormControl>
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
                         <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="marks10th"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>10th Marks (%)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="marks12th"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>12th Marks (%)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </>}

            <h3 className="font-headline text-lg font-semibold border-t pt-6">University & Socials</h3>
            <FormField
                control={form.control}
                name="campus"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Campus</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="building"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Building</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="roomNo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Room No.</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>LinkedIn Profile URL</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>GitHub Profile URL</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
