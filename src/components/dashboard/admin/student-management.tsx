
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, DocumentData, query, setDoc, serverTimestamp, where, updateDoc, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Degree } from "./degree-management";
import { Stream } from "./stream-management";
import { Batch } from "./batch-management";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SemesterManagement } from "../profile/semester-management";


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
  batch_id: string;
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
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);

  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [degreeMap, setDegreeMap] = useState<Record<string, string>>({});
  const [streamMap, setStreamMap] = useState<Record<string, string>>({});
  const [batchMap, setBatchMap] = useState<Record<string, string>>({});

  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [filters, setFilters] = useState({ degree: '', stream: '', batch: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  const fetchStudents = async () => {
      setLoading(true);
      
      const q = query(collection(db, "students"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const studentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as StudentData));
        setStudents(studentsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching students:", error);
        toast({
          title: "Error Fetching Students",
          description: error.message || "Could not fetch student data. Check permissions.",
          variant: "destructive",
        });
        setLoading(false);
      });
      return unsubscribe;
    };

  useEffect(() => {
    const unsubDegrees = onSnapshot(collection(db, 'degrees'), snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Degree));
      setDegrees(data);
      setDegreeMap(data.reduce((acc, curr) => ({...acc, [curr.id]: curr.name}), {}));
    });
    const unsubStreams = onSnapshot(collection(db, 'streams'), snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stream));
      setStreams(data);
      setStreamMap(data.reduce((acc, curr) => ({...acc, [curr.id]: curr.name}), {}));
    });
    const unsubBatches = onSnapshot(collection(db, 'batches'), snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
      setBatches(data);
      setBatchMap(data.reduce((acc, curr) => ({...acc, [curr.id]: curr.batch_name}), {}));
    });

    let unsubscribeStudents: (() => void) | undefined;
    fetchStudents().then(unsub => {
      if (unsub) {
        unsubscribeStudents = unsub;
      }
    });

    return () => {
      if (unsubscribeStudents) unsubscribeStudents();
      unsubDegrees();
      unsubStreams();
unsubBatches();
    };

  }, [toast]);

  useEffect(() => {
    let result = students;
    if (filters.degree) {
      result = result.filter(s => s.degree === filters.degree);
    }
    if (filters.stream) {
      result = result.filter(s => s.stream === filters.stream);
    }
    if (filters.batch) {
      result = result.filter(s => s.batch_id === filters.batch);
    }
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(lowercasedTerm) || 
        s.reg_no.toLowerCase().includes(lowercasedTerm)
      );
    }
    setFilteredStudents(result);
  }, [filters, searchTerm, students]);

  const handleFilterChange = (filterName: 'degree' | 'stream' | 'batch', value: string) => {
    const finalValue = value === 'all' ? '' : value;
    const newFilters = { ...filters, [filterName]: finalValue };
    
    if (filterName === 'degree') {
      newFilters.stream = '';
    }
    setFilters(newFilters);
  };


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
        const batch = writeBatch(db);
        batch.delete(doc(db, "students", deletingStudentId));
        batch.delete(doc(db, "users", deletingStudentId));
        await batch.commit();
        
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

    const profileData = {
      ...values,
      batch_id: values.batch,
    };
    // @ts-ignore
    delete profileData.batch;

    if (studentId) {
      try {
        const batch = writeBatch(db);
        const studentDocRef = doc(db, "students", studentId);
        const userDocRef = doc(db, "users", studentId);
        
        batch.update(studentDocRef, {
          ...profileData,
          updatedAt: serverTimestamp(),
        });
        batch.update(userDocRef, {
            name: values.name,
        });
        
        await batch.commit();

        toast({
          title: "Success",
          description: `Profile for ${values.name} has been updated.`,
        });
        // Do not close sheet on update, admin might want to manage semesters
      } catch (error: any) {
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update student profile.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const last4 = values.phone.slice(-4);
      const password = values.name.replace(/\s+/g, '').toLowerCase() + last4;

      try {
          await createUserAndProfile({
            email: values.email,
            password: password,
            role: 'student',
            initialProfile: profileData,
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
                Create, view, and manage all student records.
              </CardDescription>
            </div>
             <div className="flex items-center gap-4">
               <div className="text-sm text-muted-foreground text-right">
                Total Students
                <p className="font-bold text-2xl text-foreground">
                  {loading ? "..." : students.length}
                </p>
              </div>
              <Button onClick={handleAddClick}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-2 mb-6">
                <Input 
                    placeholder="Search by name or reg no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                />
                <Select value={filters.degree} onValueChange={(value) => handleFilterChange('degree', value)}>
                    <SelectTrigger className="w-full md:w-auto">
                        <SelectValue placeholder="Degree" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Degrees</SelectItem>
                        {degrees.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={filters.stream} onValueChange={(value) => handleFilterChange('stream', value)} disabled={!filters.degree}>
                    <SelectTrigger className="w-full md:w-auto">
                        <SelectValue placeholder="Stream" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Streams</SelectItem>
                        {streams.filter(s => s.degreeId === filters.degree).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.batch} onValueChange={(value) => handleFilterChange('batch', value)}>
                    <SelectTrigger className="w-full md:w-auto">
                        <SelectValue placeholder="Batch" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batch_name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Degree</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{degreeMap[student.degree] || 'N/A'}</TableCell>
                    <TableCell>{batchMap[student.batch_id] || 'N/A'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(student)}>Edit / Manage</DropdownMenuItem>
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
                  <TableCell colSpan={4} className="text-center h-24">
                    No students found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[480px] w-full">
          <SheetHeader>
            <SheetTitle>{editingStudent ? 'Edit Student' : 'Create New Student Profile'}</SheetTitle>
             <SheetDescription>
              {editingStudent ? `Manage profile and academic details for ${editingStudent.name}.` : "This will create a student profile and auth account."}
            </SheetDescription>
          </SheetHeader>
            {editingStudent ? (
              <Tabs defaultValue="profile" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Edit Profile</TabsTrigger>
                  <TabsTrigger value="semesters">Manage Semesters</TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                   <StudentForm
                    onSubmit={handleCreateOrUpdateStudent}
                    isSubmitting={isSubmitting}
                    existingStudentData={editingStudent}
                  />
                </TabsContent>
                <TabsContent value="semesters">
                   <SemesterManagement 
                    student={editingStudent} 
                    onSemesterUpdate={fetchStudents}
                    degreeMap={degreeMap}
                    streamMap={streamMap}
                    batchMap={batchMap}
                    />
                </TabsContent>
              </Tabs>
            ) : (
               <StudentForm
                onSubmit={handleCreateOrUpdateStudent}
                isSubmitting={isSubmitting}
                existingStudentData={editingStudent}
              />
            )}
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
