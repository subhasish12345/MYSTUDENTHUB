
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, DocumentData } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface Semester extends DocumentData {
    id: string;
    semester_no: number;
    section: string;
    subjects: string[];
    labs: string[];
    roomNo?: string;
    sgpa?: number | null;
    createdAt: any;
    createdBy: string;
}

const formSchema = z.object({
    semester_no: z.coerce.number().min(1).max(12),
    section: z.string().min(1, "Section is required."),
    subjects: z.string().min(1, "At least one subject is required."),
    labs: z.string().optional(),
    roomNo: z.string().optional(),
    sgpa: z.coerce.number().optional()
});

type SemesterFormValues = z.infer<typeof formSchema>;

export function SemesterManagement({ studentId, onSemesterUpdate }: { studentId: string; onSemesterUpdate: () => void }) {
    const { user: adminUser } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<SemesterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { semester_no: 1, section: "A", subjects: "", labs: "", roomNo: "" },
    });

    const handleFormSubmit = async (values: SemesterFormValues) => {
        if (!adminUser) {
            toast({ title: "Error", description: "You must be an admin to perform this action.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const semesterId = `sem-${values.semester_no}`;
            const semesterDocRef = doc(db, "students", studentId, "semesters", semesterId);

            const semesterData = {
                ...values,
                subjects: values.subjects.split(',').map(s => s.trim()).filter(Boolean),
                labs: values.labs?.split(',').map(s => s.trim()).filter(Boolean) || [],
                sgpa: values.sgpa || null,
                createdAt: serverTimestamp(),
                createdBy: adminUser.uid,
            };
            
            await setDoc(semesterDocRef, semesterData);

            toast({ title: "Success", description: `Semester ${values.semester_no} has been added.` });
            form.reset();
            setIsSheetOpen(false);
            onSemesterUpdate();
        } catch (error: any) {
            console.error("Error adding semester:", error);
            toast({ title: "Error", description: error.message || "Failed to add semester.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* This is the card that only admins see */}
            <Card className="shadow-lg bg-secondary/50">
                <CardHeader>
                    <CardTitle className="font-headline">Manage Semesters</CardTitle>
                    <CardDescription>As an admin, you can add academic semesters for this student.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={() => setIsSheetOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Semester
                    </Button>
                </CardFooter>
            </Card>

            {/* This Sheet (slide-out form) is triggered by the button above */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Add New Semester</SheetTitle>
                        <SheetDescription>Fill in the details for the student's new semester.</SheetDescription>
                    </SheetHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-4">
                            <FormField control={form.control} name="semester_no" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Semester Number</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="section" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Section</FormLabel>
                                <FormControl><Input placeholder="e.g., A, B" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="subjects" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Subjects</FormLabel>
                                <FormControl><Textarea placeholder="Comma-separated, e.g., Math, Science" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="labs" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Labs (Optional)</FormLabel>
                                <FormControl><Textarea placeholder="Comma-separated, e.g., Physics Lab, Chem Lab" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="roomNo" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Class Room No. (Optional)</FormLabel>
                                <FormControl><Input placeholder="e.g., 301B" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="sgpa" render={({ field }) => (
                                <FormItem>
                                <FormLabel>SGPA (Optional)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                             <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Semester"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </SheetContent>
            </Sheet>
        </>
    );
}
    
