
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
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

export function SemesterManagement({ 
    student, 
    onSemesterUpdate,
    degreeMap,
    streamMap,
    batchMap,
}: { 
    student: StudentData; 
    onSemesterUpdate: () => void;
    degreeMap: Record<string, string>;
    streamMap: Record<string, string>;
    batchMap: Record<string, string>;
}) {
    const { user: adminUser } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<SemesterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { 
            semester_no: 1, 
            section: "A", 
            subjects: "", 
            labs: "", 
            roomNo: "", 
            sgpa: undefined
        },
    });

     useEffect(() => {
        form.reset({
             semester_no: 1, 
             section: "A", 
             subjects: "", 
             labs: "", 
             roomNo: "", 
             sgpa: undefined
        });
    }, [student, form]);

    const handleFormSubmit = async (values: SemesterFormValues) => {
        if (!adminUser) {
            toast({ title: "Error", description: "You must be an admin to perform this action.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const studentsQuery = query(
                collection(db, "students"),
                where("degree", "==", student.degree),
                where("stream", "==", student.stream),
                where("batch_id", "==", student.batch_id)
            );

            const querySnapshot = await getDocs(studentsQuery);
            
            const batch = writeBatch(db);
            const semesterId = `sem-${values.semester_no}`;
            const semesterData = {
                semester_no: values.semester_no,
                section: values.section,
                subjects: values.subjects.split(',').map(s => s.trim()).filter(Boolean),
                labs: values.labs?.split(',').map(s => s.trim()).filter(Boolean) || [],
                roomNo: values.roomNo || "",
                sgpa: null, 
                createdAt: serverTimestamp(),
                createdBy: adminUser.uid,
            };
            
            querySnapshot.forEach((studentDoc) => {
                const semesterDocRef = doc(db, "students", studentDoc.id, "semesters", semesterId);
                let finalSemesterData = { ...semesterData };
                if (studentDoc.id === student.id && values.sgpa) {
                    finalSemesterData.sgpa = values.sgpa;
                }
                batch.set(semesterDocRef, finalSemesterData, { merge: true });
            });
            
            toast({ title: "Success", description: `Semester ${values.semester_no} has been added/updated for ${querySnapshot.size} student(s).` });

            await batch.commit();

            form.reset();
            setIsSheetOpen(false);
            onSemesterUpdate();
        } catch (error: any) {
            console.error("Error batch-adding semester:", error);
            toast({ title: "Error", description: error.message || "Failed to add semester to the group.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const targetGroupDescription = `${degreeMap[student.degree] || 'N/A'} > ${streamMap[student.stream] || 'N/A'} > ${batchMap[student.batch_id] || 'N/A'}`;

    return (
        <>
            <Card className="shadow-lg bg-secondary/50">
                <CardHeader>
                    <CardTitle className="font-headline">Manage Semesters</CardTitle>

                    <CardDescription>
                        Define curriculum for this student's academic group. This will apply to all students in the same group.
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
                           Define semester details for: <br/> <span className="font-semibold">{targetGroupDescription}</span>
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
                                <FormDescription>This section will be applied to all students in this batch for this semester.</FormDescription>
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
                                <FormLabel>SGPA for {student.name} (Optional)</FormLabel>
                                 <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormDescription>This SGPA will only be applied to {student.name}.</FormDescription>
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
