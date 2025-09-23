"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, DocumentData, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export interface Degree extends DocumentData {
  id: string;
  name: string;
  durationYears: number;
}

const formSchema = z.object({
  name: z.string().min(2, "Degree name is required."),
  durationYears: z.coerce.number().min(1, "Duration must be at least 1 year.").max(10, "Duration seems too long."),
});

type DegreeFormValues = z.infer<typeof formSchema>;

function DegreeForm({ onSubmit, isSubmitting, existingData }: { onSubmit: (values: DegreeFormValues) => Promise<void>, isSubmitting: boolean, existingData?: Degree | null }) {
  const form = useForm<DegreeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existingData || { name: "", durationYears: 4 },
  });

  useEffect(() => {
    if (existingData) form.reset(existingData);
  }, [existingData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
        <div className="space-y-4 px-1">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Degree Name</FormLabel>
              <FormControl><Input placeholder="e.g., Bachelor of Technology" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="durationYears" render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (in years)</FormLabel>
              <FormControl><Input type="number" placeholder="e.g., 4" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
        </div>
      </form>
    </Form>
  );
}

export function DegreeManagement() {
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Degree | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = collection(db, "degrees");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const degreesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Degree));
      setDegrees(degreesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching degrees:", error);
      toast({ title: "Error", description: "Could not fetch degrees. Check console for details.", variant: "destructive" });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleFormSubmit = async (values: DegreeFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingData) {
        await updateDoc(doc(db, "degrees", editingData.id), { ...values, updatedAt: serverTimestamp() });
        toast({ title: "Success", description: "Degree updated successfully." });
      } else {
        await addDoc(collection(db, "degrees"), { ...values, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "New degree added." });
      }
      setIsSheetOpen(false);
      setEditingData(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save degree.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await deleteDoc(doc(db, "degrees", deletingId));
        toast({ title: "Success", description: "Degree deleted." });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete degree.", variant: "destructive" });
      } finally {
        setDeletingId(null);
      }
    }
  };
  
  const handleAddClick = () => {
    setEditingData(null);
    setIsSheetOpen(true);
  };
  
  const handleEditClick = (degree: Degree) => {
    setEditingData(degree);
    setIsSheetOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="font-headline">Degree Management</CardTitle>
            <CardDescription>Manage all academic degrees offered.</CardDescription>
          </div>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Degree
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Degree Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : degrees.length > 0 ? (
                degrees.map((degree) => (
                  <TableRow key={degree.id}>
                    <TableCell className="font-medium">{degree.name}</TableCell>
                    <TableCell>{degree.durationYears} years</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(degree)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingId(degree.id)} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center h-24">No degrees found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingData ? "Edit Degree" : "Add New Degree"}</SheetTitle>
            <SheetDescription>Fill in the details for the academic degree.</SheetDescription>
          </SheetHeader>
          <DegreeForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} existingData={editingData} />
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the degree.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
