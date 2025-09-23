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

export interface Batch extends DocumentData {
  id: string;
  batch_name: string;
  start_year: number;
  end_year: number;
}

const formSchema = z.object({
  batch_name: z.string().min(4, "Batch name is required, e.g., 2022-2026"),
  start_year: z.coerce.number().min(2000),
  end_year: z.coerce.number().min(2000),
}).refine(data => data.end_year > data.start_year, {
    message: "End year must be after start year.",
    path: ["end_year"],
});

type BatchFormValues = z.infer<typeof formSchema>;

function BatchForm({ onSubmit, isSubmitting, existingData }: { onSubmit: (values: BatchFormValues) => Promise<void>, isSubmitting: boolean, existingData?: Batch | null }) {
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existingData || { batch_name: "", start_year: new Date().getFullYear(), end_year: new Date().getFullYear() + 4 },
  });

  useEffect(() => {
    if (existingData) form.reset(existingData);
  }, [existingData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
        <div className="space-y-4 px-1">
          <FormField control={form.control} name="batch_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Batch Name</FormLabel>
              <FormControl><Input placeholder="e.g., 2024-2028" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="start_year" render={({ field }) => (
            <FormItem>
              <FormLabel>Start Year</FormLabel>
              <FormControl><Input type="number" placeholder="e.g., 2024" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
           <FormField control={form.control} name="end_year" render={({ field }) => (
            <FormItem>
              <FormLabel>End Year</FormLabel>
              <FormControl><Input type="number" placeholder="e.g., 2028" {...field} /></FormControl>
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

export function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Batch | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = collection(db, "batches");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
      setBatches(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching batches:", error);
      toast({ title: "Error", description: "Could not fetch batches.", variant: "destructive" });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleFormSubmit = async (values: BatchFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingData) {
        await updateDoc(doc(db, "batches", editingData.id), { ...values, updatedAt: serverTimestamp() });
        toast({ title: "Success", description: "Batch updated." });
      } else {
        await addDoc(collection(db, "batches"), { ...values, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "New batch added." });
      }
      setIsSheetOpen(false);
      setEditingData(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save batch.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await deleteDoc(doc(db, "batches", deletingId));
        toast({ title: "Success", description: "Batch deleted." });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete batch.", variant: "destructive" });
      } finally {
        setDeletingId(null);
      }
    }
  };
  
  const handleAddClick = () => {
    setEditingData(null);
    setIsSheetOpen(true);
  };
  
  const handleEditClick = (batch: Batch) => {
    setEditingData(batch);
    setIsSheetOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="font-headline">Batch Management</CardTitle>
            <CardDescription>Manage all academic batches.</CardDescription>
          </div>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Batch
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead>Start Year</TableHead>
                 <TableHead>End Year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : batches.length > 0 ? (
                batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batch_name}</TableCell>
                    <TableCell>{batch.start_year}</TableCell>
                    <TableCell>{batch.end_year}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(batch)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingId(batch.id)} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center h-24">No batches found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingData ? "Edit Batch" : "Add New Batch"}</SheetTitle>
            <SheetDescription>Fill in the details for the academic batch.</SheetDescription>
          </SheetHeader>
          <BatchForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} existingData={editingData} />
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the batch.</AlertDialogDescription>
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
