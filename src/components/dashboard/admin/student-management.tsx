"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, DocumentData, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Roles } from "@/lib/roles";
import { StudentForm, StudentFormValues } from "./student-form";

export interface UserData extends DocumentData {
  id: string;
  name: string;
  email: string;
  role: Roles;
  degree?: string;
  stream?: string;
}

export function StudentManagement() {
  const [students, setStudents] = useState<UserData[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as UserData));
      setStudents(studentsData);
      setStudentCount(snapshot.size);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch student data.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddClick = () => {
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (studentId: string) => {
    setDeletingStudentId(studentId);
  };

  const confirmDelete = async () => {
    if (deletingStudentId) {
      try {
        await deleteDoc(doc(db, "users", deletingStudentId));
        toast({
          title: "Success",
          description: "Student record deleted. Remember to delete the user from Firebase Authentication.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete student record.",
          variant: "destructive",
        });
      } finally {
        setDeletingStudentId(null);
      }
    }
  };

  const handleCreateStudentAuth = async (values: StudentFormValues) => {
    setIsSubmitting(true);
    const last4 = values.phone.slice(-4);
    const password = values.name.replace(/\s+/g, '').toLowerCase() + last4;

    try {
      await createUserWithEmailAndPassword(auth, values.email, password);
      toast({
        title: "Success",
        description: `Student account created for ${values.email}. They will complete their profile on first login.`,
      });
      alert(`Password for ${values.email} is ${password}. Please share this with the student.`);
      setIsSheetOpen(false);
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-in-use') {
        toast({
          title: "Creation Failed",
          description: "This email is already in use by another account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: authError.message || "Failed to create student account.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle className="font-headline">Student Management</CardTitle>
              <CardDescription>
                Create new student accounts and view their records.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground text-right">
                Total Students
                <p className="font-bold text-2xl text-foreground">
                  {loading ? "..." : studentCount}
                </p>
              </div>
              <Button onClick={handleAddClick}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Degree</TableHead>
                <TableHead>Profile Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name || "Pending Setup"}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.degree || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={student.name ? "default" : "secondary"}>
                        {student.name ? "Completed" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem disabled>Edit (Coming Soon)</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(student.id)}
                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No students found. Click "Add Student" to create an account.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[480px]">
          <SheetHeader>
            <SheetTitle>Create New Student Account</SheetTitle>
            <SheetDescription>
              This only creates a login account. The student will be prompted to
              complete their profile on their first login.
            </SheetDescription>
          </SheetHeader>
          <StudentForm
            onSubmit={handleCreateStudentAuth}
            isSubmitting={isSubmitting}
          />
        </SheetContent>
      </Sheet>

       <AlertDialog open={!!deletingStudentId} onOpenChange={(open) => !open && setDeletingStudentId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action only deletes the user's record from Firestore. It does not remove their authentication account, which must be done manually from the Firebase Console. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingStudentId(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete Record</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
