"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, DocumentData, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StudentData } from "../admin/student-management";

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

export function SemesterManagement({ student, onSemesterUpdate }: { student: StudentData; onSemesterUpdate: () => void }) {
    const { user: adminUser } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<SemesterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { semester_no: 1, section: student.section || "A", subjects: "", labs: "", roomNo: "" },
    });

     useEffect(() => {
        form.reset({ semester_no: 1, section: student.section || "A", subjects: "", labs: "", roomNo: "" });
    }, [student, form]);

    const handleFormSubmit = async (values: SemesterFormValues) => {
        if (!adminUser) {
            toast({ title: "Error", description: "You must be an admin to perform this action.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            // Find all students in the same degree, stream, batch, and section
            const studentsQuery = query(
                collection(db, "students"),
                where("degree", "==", student.degree),
                where("stream", "==", student.stream),
                where("batch_id", "==", student.batch_id),
                where("section", "==", values.section)
            );

            const querySnapshot = await getDocs(studentsQuery);
            if (querySnapshot.empty) {
                toast({ title: "Warning", description: "No students found matching this academic group.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            const batch = writeBatch(db);
            const semesterId = `sem-${values.semester_no}`;
            const semesterData = {
                semester_no: values.semester_no,
                section: values.section,
                subjects: values.subjects.split(',').map(s => s.trim()).filter(Boolean),
                labs: values.labs?.split(',').map(s => s.trim()).filter(Boolean) || [],
                roomNo: values.roomNo || "",
                // SGPA is student-specific, so we don't batch-update it unless it's the current student's form
                sgpa: null, 
                createdAt: serverTimestamp(),
                createdBy: adminUser.uid,
            };

            querySnapshot.forEach((studentDoc) => {
                const semesterDocRef = doc(db, "students", studentDoc.id, "semesters", semesterId);
                let finalSemesterData = { ...semesterData };
                // Only apply the SGPA to the specific student this form was opened for
                if (studentDoc.id === student.id && values.sgpa) {
                    finalSemesterData.sgpa = values.sgpa;
                }
                batch.set(semesterDocRef, finalSemesterData, { merge: true });
            });

            await batch.commit();

            toast({ title: "Success", description: `Semester ${values.semester_no} has been added/updated for ${querySnapshot.size} student(s).` });
            form.reset();
            setIsSheetOpen(false);
            onSemesterUpdate(); // This will trigger a re-fetch in the parent component
        } catch (error: any) {
            console.error("Error batch-adding semester:", error);
            toast({ title: "Error", description: error.message || "Failed to add semester to the group.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card className="shadow-lg bg-secondary/50">
                <CardHeader>
                    <CardTitle className="font-headline">Manage Semesters</CardTitle>
                    <CardDescription>
                        Define curriculum for this student's academic group (Batch, Stream, Section). This will apply to all students in the same group.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={() => setIsSheetOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add/Update Semester for Group
                    </Button>
                </CardFooter>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Add/Update Group Semester</SheetTitle>
                        <SheetDescription>
                            Define semester details for all students in Batch: {student.batch_id}, Section: {form.getValues('section')}.
                        </SheetDescription>
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
                                <FormDescription>This SGPA will only be applied to {student.name}. It will not be batch-applied.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )} />
                             <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Semester for Group"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </SheetContent>
            </Sheet>
        </>
    );
}
    
