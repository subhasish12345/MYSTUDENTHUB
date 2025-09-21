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
import type { UserData } from "./teacher-management";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  // Basic Info
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  status: z.enum(['Active', 'Retired', 'Transferred']),
  
  // Professional Details
  department: z.string().min(2, "Department is required."),
  subjects: z.string().transform(val => val.split(',').map(s => s.trim()).filter(s => s.length > 0)),
  designation: z.string().min(2, "Designation is required."),
  employeeId: z.string().min(1, "Employee ID is required."),
  experienceYears: z.coerce.number().min(0, "Experience must be a positive number."),
  qualification: z.string().min(2, "Qualification is required."),
  specialization: z.string().optional(),

  // Meta / University Data
  campus: z.string().optional(),
  building: z.string().optional(),
  roomNo: z.string().optional(),
  universityId: z.string().optional(),

  // Optional Extras
  photoURL: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500, "Bio should be less than 500 characters.").optional(),
  linkedIn: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

export type TeacherFormValues = z.infer<typeof formSchema>;

interface TeacherFormProps {
  onSubmit: (values: TeacherFormValues, teacherId?: string) => Promise<void>;
  isSubmitting: boolean;
  existingTeacherData?: UserData | null;
}

export function TeacherForm({ onSubmit, isSubmitting, existingTeacherData }: TeacherFormProps) {
  const { toast } = useToast();
  const isEditMode = !!existingTeacherData;

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        email: "",
        phone: "",
        department: "",
        subjects: [],
        status: "Active",
        designation: "",
        employeeId: "",
        experienceYears: 0,
        qualification: "",
        specialization: "",
        campus: "",
        building: "",
        roomNo: "",
        universityId: "",
        photoURL: "",
        bio: "",
        linkedIn: "",
    }
  });

  useEffect(() => {
    if (existingTeacherData) {
      form.reset({
        ...existingTeacherData,
        subjects: Array.isArray(existingTeacherData.subjects) ? existingTeacherData.subjects.join(', ') : '',
        experienceYears: existingTeacherData.experienceYears || 0,
        // Ensure optional fields that might be undefined are handled
        specialization: existingTeacherData.specialization || "",
        campus: existingTeacherData.campus || "",
        building: existingTeacherData.building || "",
        roomNo: existingTeacherData.roomNo || "",
        universityId: existingTeacherData.universityId || "",
        photoURL: existingTeacherData.photoURL || "",
        bio: existingTeacherData.bio || "",
        linkedIn: existingTeacherData.linkedIn || "",
      });
    }
  }, [existingTeacherData, form]);

  const handleFormSubmit = async (values: TeacherFormValues) => {
    try {
      await onSubmit(values, existingTeacherData?.id);
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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
        <div className="space-y-6 px-1 max-h-[75vh] overflow-y-auto pr-4">
             <h3 className="font-headline text-lg font-semibold">Basic Information</h3>
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
                        <Input type="email" placeholder="e.g., amit.sharma@college.edu" {...field} disabled={isEditMode} />
                    </FormControl>
                    <FormDescription>The teacher will use this to log in. Cannot be changed after creation.</FormDescription>
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
                        <Input placeholder="e.g., 9876543210" {...field} disabled={isEditMode}/>
                    </FormControl>
                     <FormDescription>
                        Used for generating the initial password. Cannot be changed.
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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

            <h3 className="font-headline text-lg font-semibold border-t pt-6">Professional Details</h3>
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
                        <Input placeholder="e.g., DSA, OS, DBMS" {...field} value={Array.isArray(field.value) ? field.value.join(', ') : field.value} />
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
                name="designation"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Assistant Professor" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Highest Qualification</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., M.Tech in Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="experienceYears"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., CS12345" {...field} />
                    </FormControl>
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
                    <FormControl>
                        <Input placeholder="e.g., Artificial Intelligence" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <h3 className="font-headline text-lg font-semibold border-t pt-6">University Data</h3>
            <FormField
                control={form.control}
                name="campus"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Campus</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Main Campus" {...field} />
                    </FormControl>
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
                    <FormControl>
                        <Input placeholder="e.g., Block A" {...field} />
                    </FormControl>
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
                    <FormControl>
                        <Input placeholder="e.g., 205" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="universityId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>University ID</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., U-2025-CS-011" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <h3 className="font-headline text-lg font-semibold border-t pt-6">Optional Extras</h3>
             <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl>
                        <Input placeholder="https://example.com/photo.jpg" {...field} />
                    </FormControl>
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
                    <FormControl>
                        <Textarea placeholder="A short biography about the teacher..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="linkedIn"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>LinkedIn Profile URL</FormLabel>
                    <FormControl>
                        <Input placeholder="https://linkedin.com/in/..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Teacher Profile")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
