"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, DocumentData, query, setDoc, serverTimestamp, where } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
}


export function StudentManagement() {
  const { user: adminUser } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Query the 'students' collection which holds the full profiles
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
        // When deleting, we need to remove from both collections
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

  const handleCreateStudent = async (values: StudentFormValues) => {
    if (!adminUser) {
        toast({ title: "Authentication Error", description: "Admin user not found.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    const last4 = values.phone.slice(-4);
    const password = values.name.replace(/\s+/g, '').toLowerCase() + last4;

    try {
        console.log("Step 1: Attempting to create user in Firebase Auth...");
        // This will temporarily log the admin out and log the new user in. This is a known issue with the client SDK.
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, password);
        const uid = userCredential.user.uid;
        console.log("Step 1 Success: Auth user created with UID:", uid);

        // Step 2: Create the /users document (source of truth for role)
        console.log("Step 2: Creating doc in /users collection...");
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, {
            uid: uid,
            email: values.email,
            role: 'student',
            createdAt: serverTimestamp(),
            status: "Active",
        });
        console.log("Step 2 Success: /users doc created.");

        // Step 3: Create the /students document with the full profile
        console.log("Step 3: Creating doc in /students collection...");
        const studentDocRef = doc(db, "students", uid);
        await setDoc(studentDocRef, {
            uid: uid,
            name: values.name,
            email: values.email,
            phone: values.phone,
            role: "student",
            reg_no: values.reg_no,
            degree: values.degree,
            stream: values.stream,
            batch: values.batch,
            start_year: values.start_year,
            end_year: values.end_year,
            status: "Active",
            createdBy: adminUser.uid,
            createdAt: serverTimestamp(),
            // Empty student-editable fields
            linkedin: "",
            github: "",
            photoURL: "",
            bio: "",
            address: "",
            internships: [],
            portfolio: "",
            courses: [],
            emergencyContact: "",
        });
        console.log("Step 3 Success: /students doc created.");


        toast({
            title: "Success",
            description: `Student account created for ${values.email}.`,
        });
        alert(`IMPORTANT: Password for ${values.email} is ${password}. Please share this with the student. You have been logged in as this new user.`);
        setIsSheetOpen(false);

    } catch (error: any) {
      console.error("Student Creation Failed:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: "Creation Failed",
          description: "This email is already in use by another account.",
          variant: "destructive",
        });
      } else if (error.code === 'permission-denied') {
         toast({
          title: "Permission Denied",
          description: "Your security rules are blocking this action. Please ensure the admin has permission to create users.",
          variant: "destructive",
        });
      }
      else {
        toast({
          title: "Error",
          description: error.message || "Failed to create student account.",
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
              This will create the student's auth account and their full profile record.
            </SheetDescription>
          </SheetHeader>
          <StudentForm
            onSubmit={handleCreateStudent}
            isSubmitting={isSubmitting}
          />
        </SheetContent>
      </Sheet>

       <AlertDialog open={!!deletingStudentId} onOpenChange={(open) => !open && setDeletingStudentId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action deletes the student's profile from the /users and /students collections. It does not remove their authentication account from Firebase Auth. This must be done manually.
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

    