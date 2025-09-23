"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, DocumentData, query, setDoc, serverTimestamp, where, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
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
import { StudentForm, StudentFormValues } from "./student-form";
import { useAuth } from "@/hooks/use-auth";
import { createUserAndProfile } from "@/lib/createUserAndProfile";


export interface StudentData extends DocumentData {
  id: string; // This will be the UID
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: "student";
  // Admin-only fields
  reg_no: string;
  degree: string;
  stream: string;
  batch: string;
  start_year: number;
  end_year: number;
  status: "Active" | "Suspended" | "Graduated";
  createdBy: string;
  createdAt: any;
  // Student-editable fields
  linkedin?: string;
  github?: string;
  photoURL?: string;
  bio?: string;
  address?: string;
  internships?: string[];
  portfolio?: string;
  courses?: string[];
  emergencyContact?: string;
  campus?: string;
  building?: string;
  roomNo?: string;
}


export function StudentManagement() {
  const { user: adminUser } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "students"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as StudentData));
      setStudents(studentsData);
      setStudentCount(snapshot.size);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      toast({
        title: "Error Fetching Students",
        description: "You may not have permission to view this data. Please check your Firestore security rules.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddClick = () => {
    setEditingStudent(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (student: StudentData) => {
    setEditingStudent(student);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (studentId: string) => {
    setDeletingStudentId(studentId);
  };

  const confirmDelete = async () => {
    if (deletingStudentId) {
      try {
        await deleteDoc(doc(db, "students", deletingStudentId));
        await deleteDoc(doc(db, "users", deletingStudentId));
        toast({
          title: "Success",
          description: "Student record deleted. Remember to delete the user from Firebase Authentication manually if needed.",
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

  const handleCreateOrUpdateStudent = async (values: StudentFormValues, studentId?: string) => {
    if (!adminUser) {
        toast({ title: "Authentication Error", description: "Admin user not found.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    if (studentId) { // This is an update
      try {
        const studentDocRef = doc(db, "students", studentId);
        await updateDoc(studentDocRef, {
          ...values,
          updatedAt: serverTimestamp(),
        });
        
        toast({
          title: "Success",
          description: `Profile for ${values.name} has been updated.`,
        });
        setIsSheetOpen(false);

      } catch (error: any) {
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update student profile.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else { // This is a new creation
      const last4 = values.phone.slice(-4);
      const password = values.name.replace(/\s+/g, '').toLowerCase() + last4;

      try {
          await createUserAndProfile({
            email: values.email,
            password: password,
            role: 'student',
            initialProfile: {
              ...values,
              linkedin: "",
              github: "",
              photoURL: "",
              bio: "",
              address: "",
              internships: [],
              portfolio: "",
              courses: [],
              emergencyContact: "",
              campus: "",
              building: "",
              roomNo: "",
            },
            adminUid: adminUser.uid,
          });

          toast({
              title: "Success",
              description: `Student profile created for ${values.email}.`,
          });
           alert(`IMPORTANT: A password for ${values.email} has been generated: ${password}. Please share this with the user securely.`);
          setIsSheetOpen(false);

      } catch (error: any) {
        console.error("Student Creation Failed:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create student profile.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
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
                Create new student accounts and manage their records.
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
                <TableHead>Batch</TableHead>
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
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.degree}</TableCell>
                    <TableCell>{student.batch}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(student)}>Edit</DropdownMenuItem>
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
            <SheetTitle>{editingStudent ? 'Edit Student Profile' : 'Create New Student Profile'}</SheetTitle>
            <SheetDescription>
              {editingStudent ? "Update the student's profile information." : "This will create a student profile and auth account."}
            </SheetDescription>
          </SheetHeader>
          <StudentForm
            onSubmit={handleCreateOrUpdateStudent}
            isSubmitting={isSubmitting}
            existingStudentData={editingStudent}
          />
        </SheetContent>
      </Sheet>

       <AlertDialog open={!!deletingStudentId} onOpenChange={(open) => !open && setDeletingStudentId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action deletes the student's profile from the /students and /users collections. It does not remove their authentication account, which must be done manually.
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
