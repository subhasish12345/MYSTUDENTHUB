"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, DocumentData, serverTimestamp, query, where, setDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
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

export interface UserData extends DocumentData {
  id: string;
  name: string;
  email: string;
  role: Roles;
  department?: string;
  subjects?: string[];
  status?: 'Active' | 'Retired' | 'Transferred';
  phone?: string;
  semesters?: number[];
  years?: number[];
  salary?: number;
  gender?: string;
  joiningDate?: string;
  teacherId?: string;
}


export function TeacherManagement() {
  const [teachers, setTeachers] = useState<UserData[]>([]);
  const [teacherCount, setTeacherCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserData | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "teacher"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teachersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as UserData));
      setTeachers(teachersData);
      setTeacherCount(snapshot.size);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        await deleteDoc(doc(db, "users", deletingTeacherId));
        toast({
          title: "Success",
          description: "Teacher record deleted. Remember to delete the user from the Firebase Authentication tab as well.",
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


  const handleFormSubmit = async (values: TeacherFormValues) => {
    const dataToSave = {
        name: values.name,
        email: values.email,
        department: values.department,
        status: values.status,
        phone: values.phone,
        teacherId: values.teacherId,
        gender: values.gender,
        joiningDate: values.joiningDate,
        role: 'teacher' as const,
        subjects: values.subjects.split(',').map(s => s.trim()).filter(Boolean),
        semesters: values.semesters?.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s)) || [],
        years: values.years?.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s)) || [],
        salary: values.salary ? parseFloat(values.salary) : 0,
    };

    try {
        if (editingTeacher) {
            const teacherRef = doc(db, "users", editingTeacher.id);
            await updateDoc(teacherRef, { ...dataToSave, updatedAt: serverTimestamp()});
            toast({
                title: "Success",
                description: "Teacher record updated successfully.",
            });
        } else {
            const tempAdminAuth = auth;
            const last4 = values.phone ? values.phone.slice(-4) : '1234';
            const password = values.name.replace(/\s+/g, '').toLowerCase() + last4;
            
            try {
              const userCredential = await createUserWithEmailAndPassword(tempAdminAuth, values.email, password);
              const uid = userCredential.user.uid;

              await setDoc(doc(db, "users", uid), {
                  ...dataToSave,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
              });

              toast({
                  title: "Success",
                  description: "New teacher added and account created.",
              });
              console.log(`Password for ${values.email} is ${password}. Please share this with the user.`);
              alert(`Password for ${values.email} is ${password}. Please share this with the user.`);

            } catch (authError: any) {
               if (authError.code === 'auth/email-already-in-use') {
                 toast({
                    title: "Creation Failed",
                    description: "This email is already in use by another account.",
                    variant: "destructive",
                });
               } else {
                 throw authError; // Re-throw other auth errors
               }
            }
        }
        setIsSheetOpen(false);
        setEditingTeacher(null);
    } catch (error: any) {
        console.error("Error saving teacher:", error);
        if (error.code !== 'auth/email-already-in-use') { // Don't show generic error if it was the specific email error
           toast({
              title: "Error",
              description: error.message || "Failed to save teacher record.",
              variant: "destructive",
          });
        }
    }
  };

  const sheetTitle = editingTeacher ? "Edit Teacher" : "Add New Teacher";
  const sheetDescription = editingTeacher ? "Update the details of the existing teacher." : "Fill in the details to add a new teacher and create their login.";

  const defaultValues = useMemo(() => {
    if (editingTeacher) {
        return {
            name: editingTeacher.name || '',
            email: editingTeacher.email || '',
            department: editingTeacher.department || '',
            subjects: (editingTeacher.subjects || []).join(', '),
            phone: editingTeacher.phone || '',
            semesters: (editingTeacher.semesters || []).join(', '),
            years: (editingTeacher.years || []).join(', '),
            salary: (editingTeacher.salary || 0).toString(),
            gender: editingTeacher.gender || '',
            joiningDate: editingTeacher.joiningDate || '',
            teacherId: editingTeacher.teacherId || '',
            status: editingTeacher.status || 'Active',
        };
    }
    return {
        name: '', email: '', department: '', subjects: '', phone: '',
        semesters: '', years: '', salary: '', gender: '', joiningDate: '', teacherId: '',
        status: 'Active' as const,
    };
  }, [editingTeacher]);
  
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
                  <CardDescription>View, add, edit, and remove teacher records.</CardDescription>
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
                <TableHead>Department</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                        <div>{teacher.name}</div>
                        <div className="text-xs text-muted-foreground">{teacher.email}</div>
                    </TableCell>
                    <TableCell>{teacher.department}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(teacher.subjects || []).map((subject) => (
                          <Badge key={subject} variant="secondary">{subject}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(teacher.status)}>{teacher.status}</Badge>
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
                          <DropdownMenuItem onClick={() => handleEditClick(teacher)} disabled={!teacher.id}>Edit</DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(teacher.id)}
                            disabled={!teacher.id}
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
                    No teachers found. Click "Add Teacher" to start.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
            <SheetHeader>
                <SheetTitle>{sheetTitle}</SheetTitle>
                <SheetDescription>{sheetDescription}</SheetDescription>
            </SheetHeader>
            <TeacherForm 
              onSubmit={handleFormSubmit} 
              defaultValues={defaultValues}
              isEditing={!!editingTeacher}
            />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingTeacherId} onOpenChange={(open) => !open && setDeletingTeacherId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action only deletes the teacher's record from Firestore. It does not remove their authentication account, which must be done manually from the Firebase Console. This action cannot be undone.
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
