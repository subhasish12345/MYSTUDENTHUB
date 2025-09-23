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
import { Textarea } from "@/components/ui/textarea";
import { Roles } from "@/lib/roles";
import { DocumentData } from "firebase/firestore";

// Base schema for fields absolutely common to all roles
const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").optional(),
  photoURL: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  bio: z.string().max(500, "Bio should be less than 500 characters.").optional(),
  linkedin: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  github: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

// Schema for student-specific editable fields
const studentSchema = baseSchema.extend({
  address: z.string().optional(),
  portfolio: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  emergencyContact: z.string().optional(),
  internships: z.string().optional(), // In form, it's a string, converted on submit
  courses: z.string().optional(), // In form, it's a string, converted on submit
  campus: z.string().optional(),
  building: z.string().optional(),
  roomNo: z.string().optional(),
});

// Schema for teacher-specific editable fields
const teacherSchema = baseSchema.extend({
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  campus: z.string().optional(),
  building: z.string().optional(),
  roomNo: z.string().optional(),
});


export type ProfileFormValues = z.infer<typeof studentSchema> | z.infer<typeof teacherSchema>;

interface EditProfileFormProps {
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  isSubmitting: boolean;
  existingData: DocumentData;
  userRole: Roles;
}

export function EditProfileForm({ onSubmit, isSubmitting, existingData, userRole }: EditProfileFormProps) {
  const { toast } = useToast();
  const isStudent = userRole === 'student';
  const formSchema = isStudent ? studentSchema : teacherSchema;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (existingData) {
      const defaultVals: { [key: string]: any } = {};
      Object.keys(formSchema.shape).forEach(key => {
          const value = existingData[key];
          if (Array.isArray(value)) {
              defaultVals[key] = value.join(', ');
          } else {
              // Ensure value is never null/undefined for form inputs
              defaultVals[key] = value ?? ""; 
          }
      });
      form.reset(defaultVals);
    }
  }, [existingData, form, formSchema]);

  const handleFormSubmit = async (values: ProfileFormValues) => {
    try {
      // Ensure no undefined values are sent to Firestore
      const sanitizedValues: { [key: string]: any } = {};
      for (const key in values) {
        const value = (values as any)[key];
        sanitizedValues[key] = value === undefined ? "" : value;
      }
      await onSubmit(sanitizedValues as ProfileFormValues);
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
            
            {/* --- STUDENT SPECIFIC FIELDS --- */}
            {isStudent && (
                <>
                 <h3 className="font-headline text-lg font-semibold border-t pt-6">Contact & Career</h3>
                 <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl><Textarea placeholder="Your current address" {...field as any} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Emergency Contact</FormLabel>
                        <FormControl><Input placeholder="Name and phone number" {...field as any} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="portfolio"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Portfolio URL</FormLabel>
                        <FormControl><Input placeholder="https://my-portfolio.com" {...field as any} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="courses"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Additional Courses</FormLabel>
                        <FormControl><Textarea placeholder="e.g., Advanced Python, UI/UX Design" {...field as any} /></FormControl>
                         <FormDescription>Comma-separated list of courses.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="internships"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Internships</FormLabel>
                        <FormControl><Textarea placeholder="e.g., Software Intern at Google, PM Intern at Microsoft" {...field as any} /></FormControl>
                        <FormDescription>Comma-separated list of internships.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                </>
            )}

            
            {/* --- TEACHER SPECIFIC FIELDS --- */}
            {!isStudent && <>
                <h3 className="font-headline text-lg font-semibold border-t pt-6">Professional Details</h3>
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
