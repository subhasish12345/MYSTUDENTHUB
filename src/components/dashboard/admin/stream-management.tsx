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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Degree } from "./degree-management";

export interface Stream extends DocumentData {
  id: string;
  name: string;
  degreeId: string;
}

const formSchema = z.object({
  name: z.string().min(2, "Stream name is required."),
  degreeId: z.string().min(1, "You must select a parent degree."),
});

type StreamFormValues = z.infer<typeof formSchema>;

function StreamForm({ onSubmit, isSubmitting, existingData, degrees }: { onSubmit: (values: StreamFormValues) => Promise<void>, isSubmitting: boolean, existingData?: Stream | null, degrees: Degree[] }) {
  const form = useForm<StreamFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existingData || { name: "", degreeId: "" },
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
              <FormLabel>Stream Name</FormLabel>
              <FormControl><Input placeholder="e.g., Computer Science" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="degreeId" render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Degree</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a degree" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {degrees.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
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

export function StreamManagement() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [degreeMap, setDegreeMap] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Stream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubDegrees = onSnapshot(collection(db, "degrees"), (snapshot) => {
      const degreesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Degree));
      setDegrees(degreesData);
      setDegreeMap(degreesData.reduce((acc, curr) => ({...acc, [curr.id]: curr.name}), {}));
    });

    const unsubStreams = onSnapshot(collection(db, "streams"), (snapshot) => {
      const streamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stream));
      setStreams(streamsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching streams:", error);
      toast({ title: "Error", description: "Could not fetch streams.", variant: "destructive" });
      setLoading(false);
    });

    return () => {
      unsubDegrees();
      unsubStreams();
    };
  }, [toast]);
  
  const handleFormSubmit = async (values: StreamFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingData) {
        await updateDoc(doc(db, "streams", editingData.id), { ...values, updatedAt: serverTimestamp() });
        toast({ title: "Success", description: "Stream updated successfully." });
      } else {
        await addDoc(collection(db, "streams"), { ...values, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "New stream added." });
      }
      setIsSheetOpen(false);
      setEditingData(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save stream.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await deleteDoc(doc(db, "streams", deletingId));
        toast({ title: "Success", description: "Stream deleted." });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete stream.", variant: "destructive" });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleAddClick = () => {
    setEditingData(null);
    setIsSheetOpen(true);
  };
  
  const handleEditClick = (stream: Stream) => {
    setEditingData(stream);
    setIsSheetOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="font-headline">Stream Management</CardTitle>
            <CardDescription>Manage all academic streams within degrees.</CardDescription>
          </div>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Stream
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stream Name</TableHead>
                <TableHead>Parent Degree</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : streams.length > 0 ? (
                streams.map((stream) => (
                  <TableRow key={stream.id}>
                    <TableCell className="font-medium">{stream.name}</TableCell>
                    <TableCell>{degreeMap[stream.degreeId] || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(stream)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingId(stream.id)} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center h-24">No streams found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingData ? "Edit Stream" : "Add New Stream"}</SheetTitle>
            <SheetDescription>A stream must belong to a parent degree.</SheetDescription>
          </SheetHeader>
          <StreamForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} existingData={editingData} degrees={degrees}/>
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the stream. This action cannot be undone.</AlertDialogDescription>
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
