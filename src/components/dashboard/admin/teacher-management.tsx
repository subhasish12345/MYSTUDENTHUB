"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, DocumentData, serverTimestamp, query, where, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TeacherForm, TeacherFormValues } from "./teacher-form";
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
import { useAuth } from "@/hooks/use-auth";
import { createUserAndProfile } from "@/lib/createUserAndProfile";

export interface UserData extends DocumentData {
  id: string;
  name: string;
  email: string;
  role: Roles;
  department?: string;
  subjects?: string[];
  status?: 'Active' | 'Retired' | 'Transferred';
  phone?: string;
  experienceYears?: number;
  specialization?: string;
  campus?: string;
  building?: string;
  roomNo?: string;
  universityId?: string;
  photoURL?: string;
  bio?: string;
  linkedIn?: string;
  designation?: string;
  employeeId?: string;
  qualification?: string;
}

export function TeacherManagement() {
  const { user: adminUser } = useAuth();
  const [teachers, setTeachers] = useState<UserData[]>([]);
  const [teacherCount, setTeacherCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<UserData | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "teachers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teachersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as UserData));
      setTeachers(teachersData);
      setTeacherCount(snapshot.size);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching teachers:", error);
        toast({
            title: "Error Fetching Teachers",
            description: "You may not have permission to view this data. Please check your Firestore security rules.",
            variant: "destructive",
        });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddClick = () => {
    setEditingTeacher(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (teacher: UserData) => {
    setEditingTeacher(teacher);
    setIsSheetOpen(true);
  };
  
  const handleDeleteClick = (teacherId: string) => {
    setDeletingTeacherId(teacherId);
  };

  const confirmDelete = async () => {
    if (deletingTeacherId) {
      try {
        await deleteDoc(doc(db, "teachers", deletingTeacherId));
        await deleteDoc(doc(db, "users", deletingTeacherId));

        toast({
          title: "Success",
          description: "Teacher record deleted. Remember to delete from Firebase Auth manually.",
        });
      } catch (error) {
        console.error("Error deleting teacher:", error);
        toast({
          title: "Error",
          description: "Failed to delete teacher record.",
          variant: "destructive",
        });
      } finally {
        setDeletingTeacherId(null);
      }
    }
  };

  const handleCreateOrUpdateTeacher = async (values: TeacherFormValues, teacherId?: string) => {
    setIsSubmitting(true);
    
    if (teacherId) { // This is an update
      try {
        const teacherDocRef = doc(db, "teachers", teacherId);
        await updateDoc(teacherDocRef, {
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
          description: error.message || "Failed to update teacher profile.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else { // This is a new creation
      if (!adminUser) {
        toast({ title: "Authentication Error", description: "Admin user not found.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      
      const last4 = values.phone.slice(-4);
      const password = values.name.replace(/\s+/g, '').toLowerCase() + last4;
      
      try {
        await createUserAndProfile({
          email: values.email,
          password: password,
          role: 'teacher',
          initialProfile: values,
          adminUid: adminUser.uid,
        });

        toast({
            title: "Success",
            description: `Account and profile created for ${values.email}.`,
        });
        alert(`IMPORTANT: Password for ${values.email} is ${password}. Please share this with the user.`);
        setIsSheetOpen(false);

      } catch (error: any) {
         if (error.code === 'auth/email-already-in-use') {
           toast({
              title: "Creation Failed",
              description: "This email is already in use by another account.",
              variant: "destructive",
          });
         } else {
           toast({
              title: "Error",
              description: error.message || "Failed to create user account.",
              variant: "destructive",
          });
         }
      } finally {
          setIsSubmitting(false);
      }
    }
  };
  
  const getStatusVariant = (status: UserData['status']) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Retired': return 'secondary';
        case 'Transferred': return 'outline';
        default: return 'secondary';
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                  <CardTitle className="font-headline">Teacher Management</CardTitle>
                  <CardDescription>Create new teacher accounts and manage records.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground text-right">
                      Total Teachers
                      <p className="font-bold text-2xl text-foreground">{loading ? '...' : teacherCount}</p>
                  </div>
                  <Button onClick={handleAddClick}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Teacher
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
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                     <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.department}</TableCell>
                    <TableCell>
                        <Badge variant={teacher.status ? getStatusVariant(teacher.status) : 'outline'}>
                            {teacher.status || 'N/A'}
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
                          <DropdownMenuItem onClick={() => handleEditClick(teacher)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(teacher.id)}
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
                    No teachers found. Click "Add Teacher" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl w-full">
            <SheetHeader>
                <SheetTitle>{editingTeacher ? "Edit Teacher Profile" : "Create New Teacher"}</SheetTitle>
                <SheetDescription>
                    {editingTeacher ? "Update the teacher's profile information." : "This creates a login account and a complete profile for the teacher."}
                </SheetDescription>
            </SheetHeader>
            <TeacherForm 
              onSubmit={handleCreateOrUpdateTeacher} 
              isSubmitting={isSubmitting}
              existingTeacherData={editingTeacher}
            />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingTeacherId} onOpenChange={(open) => !open && setDeletingTeacherId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action deletes the teacher's profile from the /teachers and /users collections. It does not remove their authentication account, which must be done manually.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingTeacherId(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete Record</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
