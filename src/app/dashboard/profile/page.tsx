"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, DocumentData, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PenSquare, Mail, Phone, Building, GraduationCap, Briefcase, Linkedin, Github, Home, FileText, BriefcaseBusiness, ShieldAlert, BookOpen, Percent } from "lucide-react";
import { StudentData } from "@/components/dashboard/admin/student-management";
import { UserData } from "@/components/dashboard/admin/teacher-management";

import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { EditProfileForm, ProfileFormValues } from "@/components/dashboard/profile/edit-profile-form";
import { useToast } from "@/hooks/use-toast";
import { Semester } from "@/components/dashboard/profile/semester-management";
import { Degree } from "@/components/dashboard/admin/degree-management";
import { Stream } from "@/components/dashboard/admin/stream-management";
import { Batch } from "@/components/dashboard/admin/batch-management";
import { Progress } from "@/components/ui/progress";


type ProfileData = (StudentData | UserData) & { id: string };

interface AttendanceRecord {
    id: string;
    present: string[];
    absent: string[];
}

interface SemesterWithAttendance extends Semester {
    attendance?: {
        total: number;
        attended: number;
        percentage: number;
    };
}


export default function ProfilePage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [semesters, setSemesters] = useState<SemesterWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [degreeMap, setDegreeMap] = useState<Record<string, string>>({});
  const [streamMap, setStreamMap] = useState<Record<string, string>>({});
  const [batchMap, setBatchMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const fetchUserData = async () => {
    if (!user || !userRole) return;
    setLoading(true);

    const collectionName = userRole === 'student' ? 'students' : 'teachers';
    const userDocRef = doc(db, collectionName, user.uid);
    
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as ProfileData
        setProfileData(data);
        if (data.role === 'student') {
            await fetchAcademicDataAndSemesters(data as StudentData);
        }
      } else {
        console.error("No profile document found for UID:", user.uid, "in collection:", collectionName);
        // Fallback for profile initialization
        const scaffoldData = { uid: user.uid, email: user.email, createdAt: serverTimestamp() };
        await setDoc(userDocRef, scaffoldData, { merge: true });
        const newDocSnap = await getDoc(userDocRef);
        if(newDocSnap.exists()) 
          setProfileData({ id: newDocSnap.id, ...newDocSnap.data() } as ProfileData);
          toast({ title: "Profile Initialized", description: "Your profile was created. Please fill in your details."});
        }
      }
    } catch (error) {
       console.error("Error fetching user data:", error);
       toast({ title: "Error", description: "Could not fetch your profile data.", variant: "destructive" });
       setProfileData(null);
    } finally {
        setLoading(false);
    }
  };

  const fetchAcademicDataAndSemesters = async (studentData: StudentData) => {
    try {
        const [degreeSnap, streamSnap, batchSnap] = await Promise.all([
            getDocs(collection(db, 'degrees')),
            getDocs(collection(db, 'streams')),
            getDocs(collection(db, 'batches'))
        ]);

        const degrees = degreeSnap.docs.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.data().name }), {});
        const streams = streamSnap.docs.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.data().name }), {});
        const batches = batchSnap.docs.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.data().batch_name }), {});

        setDegreeMap(degrees);
        setStreamMap(streams);
        setBatchMap(batches);

        const semestersQuery = query(collection(db, "students", studentData.uid, "semesters"), orderBy("semester_no", "asc"));
        const semestersSnapshot = await getDocs(semestersQuery);
        const semesterData = semestersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Semester));
        
        const semestersWithAttendance = await Promise.all(semesterData.map(async (sem) => {
            const degreeName = degrees[studentData.degree] || studentData.degree;
            const streamName = streams[studentData.stream] || studentData.stream;
            const batchName = batches[studentData.batch_id] || studentData.batch_id;
            
            if (!degreeName || !streamName || !batchName || !sem.section) {
              return { ...sem };
            }

            const groupId = `${degreeName}_${streamName}_${batchName}_sem${sem.semester_no}_${sem.section}`.replace(/\s+/g, '_');
            
            const attendanceQuery = query(collection(db, `semesterGroups/${groupId}/attendance`));
            const attendanceSnap = await getDocs(attendanceQuery);
            
            if (attendanceSnap.empty) {
                return { ...sem };
            }

            const attendanceRecords = attendanceSnap.docs.map(doc => doc.data() as AttendanceRecord);
            const total = attendanceRecords.length;
            const attended = attendanceRecords.filter(rec => rec.present.includes(studentData.uid)).length;
            const percentage = total > 0 ? (attended / total) * 100 : 0;
            
            return { ...sem, attendance: { total, attended, percentage } };
        }));

        setSemesters(semestersWithAttendance);

    } catch (error) {
        console.error("Error fetching academic or attendance data:", error);
        toast({ title: "Error", description: "Could not load complete academic or attendance details.", variant: "destructive" });
    }
  };


  useEffect(() => {
    if (isClient && !authLoading) {
      if (user && userRole) {
        fetchUserData();
      } else {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, isClient, authLoading]);

  const handleProfileUpdate = async (values: ProfileFormValues) => {
    if (!user || !userRole) {
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
        const collectionName = userRole === 'student' ? 'students' : 'teachers';
        const userDocRef = doc(db, collectionName, user.uid);
        
        const updateValues: DocumentData = { ...values };
        if (typeof values.internships === 'string') {
            updateValues.internships = values.internships.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (typeof values.courses === 'string') {
            updateValues.courses = values.courses.split(',').map(s => s.trim()).filter(Boolean);
        }

        await setDoc(userDocRef, {
            ...updateValues,
            updatedAt: serverTimestamp(),
        }, { merge: true });
        
        toast({ title: "Success!", description: "Your profile has been updated." });
        await fetchUserData(); // Re-fetch data to show updated info
        setIsSheetOpen(false);
    } catch (error: any) {
        console.error("Error updating profile:", error);
        toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isClient || authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-32" />
            </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return <p className="text-center text-destructive">No profile data found. Please complete your profile setup or contact an administrator.</p>;
  }

  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student';
  const studentProfile = isStudent ? profileData as StudentData : null;

  const displayName = profileData.name || "User";
  const displayEmail = profileData.email || user?.email || "No email";
  const displayDegree = isStudent ? (degreeMap[(profileData as StudentData).degree] || (profileData as StudentData).degree) : (profileData as UserData).designation;

  return (
    <>
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={profileData.photoURL} alt={displayName} data-ai-hint="person face" />
            <AvatarFallback className="text-3xl">{displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                 <div>
                    <CardTitle className="font-headline text-3xl">{displayName}</CardTitle>
                    <CardDescription className="text-lg">{displayDegree}</CardDescription>
                </div>
                 <Button className="mt-4 sm:mt-0" onClick={() => setIsSheetOpen(true)}>
                    <PenSquare className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
            </div>
            <div className="flex items-center gap-4 mt-4 text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {displayEmail}</div>
                {profileData.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {profileData.phone}</div>}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    {isTeacher ? <Briefcase/> : <GraduationCap/>}
                    {isTeacher ? 'Professional Information' : 'Academic Details'}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {isTeacher && <>
                    <InfoItem label="Department" value={(profileData as UserData).department} />
                    <InfoItem label="Qualification" value={(profileData as UserData).qualification} />
                    <InfoItem label="Specialization" value={(profileData as UserData).specialization} />
                    <InfoItem label="Experience" value={(profileData as UserData).experienceYears ? `${(profileData as UserData).experienceYears} years` : undefined} />
                    <InfoItem label="Employee ID" value={(profileData as UserData).employeeId} />
                     <InfoItem label="Status">
                        {profileData.status && <Badge variant={profileData.status === 'Active' ? 'default' : 'secondary'}>{profileData.status}</Badge>}
                    </InfoItem>
                    <div className="md:col-span-2">
                         <InfoItem label="Subjects" value={(profileData as UserData).subjects?.join(', ')} />
                    </div>
                </>}
                 {isStudent && studentProfile && <>
                    <InfoItem label="Registration No." value={studentProfile.reg_no} />
                    <InfoItem label="Degree" value={degreeMap[studentProfile.degree] || studentProfile.degree} />
                    <InfoItem label="Stream" value={streamMap[studentProfile.stream] || studentProfile.stream} />
                    <InfoItem label="Batch" value={batchMap[studentProfile.batch_id] || studentProfile.batch_id} />
                    <InfoItem label="Start Year" value={studentProfile.start_year} />
                    <InfoItem label="End Year" value={studentProfile.end_year} />
                </>}
            </CardContent>
        </Card>
        
        <div className="space-y-8">
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2"><Building/> University Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                  <InfoItem label="Campus" value={profileData.campus} />
                  <InfoItem label="Building" value={profileData.building} />
                  <InfoItem label="Room No." value={profileData.roomNo} />
                  <InfoItem label="University ID" value={profileData.universityId} />
              </CardContent>
          </Card>
           <Card className="shadow-lg">
             <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Linkedin/> Social & Links</CardTitle>
            </CardHeader>
             <CardContent className="space-y-2 text-sm">
                 {profileData.linkedin ? 
                    <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <Linkedin className="h-4 w-4" /> LinkedIn Profile
                    </a>
                    : <InfoItem label="LinkedIn" value="Not provided" />
                }
                {profileData.github ? 
                      <a href={profileData.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <Github className="h-4 w-4" /> GitHub Profile
                    </a>
                    : <InfoItem label="GitHub" value="Not provided" />
                }
                 {studentProfile?.portfolio ? 
                      <a href={studentProfile.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <BriefcaseBusiness className="h-4 w-4" /> Portfolio
                    </a>
                    : isStudent && <InfoItem label="Portfolio" value="Not provided" />
                }
            </CardContent>
          </Card>
        </div>
      </div>
      
      {isStudent && studentProfile && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                  <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2"><Home /> Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                      <InfoItem label="Address" value={studentProfile?.address || "Not provided"} />
                      <InfoItem label="Emergency Contact" value={studentProfile?.emergencyContact || "Not provided"} />
                  </CardContent>
              </Card>

              <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><BookOpen /> Courses & Internships</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                      <InfoItem label="Courses" value={Array.isArray(studentProfile?.courses) ? studentProfile.courses.join(', ') : studentProfile?.courses || "Not provided"} />
                      <InfoItem label="Internships" value={Array.isArray(studentProfile?.internships) ? studentProfile.internships.join(', ') : studentProfile?.internships || "Not provided"} />
                  </CardContent>
              </Card>
            </div>
            
            {semesters.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline">Semesters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {semesters.map(sem => (
                             <Card key={sem.id} className="bg-muted/50">
                                 <CardHeader>
                                     <CardTitle className="text-lg">Semester {sem.semester_no}</CardTitle>
                                     <CardDescription>Section: {sem.section} | SGPA: {sem.sgpa || 'N/A'}</CardDescription>
                                 </CardHeader>
                                 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <InfoItem label="Subjects" value={Array.isArray(sem.subjects) ? sem.subjects.join(', ') : sem.subjects} />
                                    <InfoItem label="Labs" value={Array.isArray(sem.labs) ? sem.labs.join(', ') : sem.labs} />
                                    <InfoItem label="Room No." value={sem.roomNo} />
                                 </CardContent>
                                  {sem.attendance && (
                                     <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Percent className="h-4 w-4" />
                                            Attendance
                                        </div>
                                         <div className="w-full space-y-1">
                                             <div className="flex justify-between text-xs text-muted-foreground">
                                                 <span>{sem.attendance.attended} / {sem.attendance.total} classes attended</span>
                                                 <span>{sem.attendance.percentage.toFixed(1)}%</span>
                                            </div>
                                             <Progress value={sem.attendance.percentage} className="h-2" />
                                         </div>
                                     </CardFooter>
                                 )}
                             </Card>
                        ))}
                    </CardContent>
                </Card>
            )}
          </>
      )}

      {profileData.bio && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><FileText /> Bio</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{profileData.bio}</p>
            </CardContent>
        </Card>
      )}

    </div>

     <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl w-full">
            <SheetHeader>
                <SheetTitle>Edit Your Profile</SheetTitle>
                <SheetDescription>
                    Update your personal and professional information. Click save when you're done.
                </SheetDescription>
            </SheetHeader>
            <EditProfileForm
              onSubmit={handleProfileUpdate}
              isSubmitting={isSubmitting}
              existingData={profileData}
              userRole={userRole!}
            />
        </SheetContent>
      </Sheet>
    </>
  );
}

const InfoItem = ({ label, value, children }: { label: string; value?: string | number | null; children?: React.ReactNode }) => {
    if (value === undefined && !children) return null;
    return (
        <div className="grid grid-cols-2 items-start">
            <p className="font-semibold text-muted-foreground">{label}</p>
            {value ? <p className="whitespace-pre-wrap">{value}</p> : (children || <p className="text-muted-foreground/70 italic">Not provided</p>)}
        </div>
    )
}
