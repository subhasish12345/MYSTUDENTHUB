"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, DocumentData, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PenSquare, Mail, Phone, Building, GraduationCap, Briefcase, Linkedin, Github, Home, FileText, BriefcaseBusiness, ShieldAlert, BookOpen } from "lucide-react";
import { StudentData } from "@/components/dashboard/admin/student-management";
import { UserData } from "@/components/dashboard/admin/teacher-management";

import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { EditProfileForm, ProfileFormValues } from "@/components/dashboard/profile/edit-profile-form";
import { useToast } from "@/hooks/use-toast";
import { Semester, SemesterManagement } from "@/components/dashboard/profile/semester-management";

type ProfileData = (StudentData | UserData) & { id: string };

export default function ProfilePage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            await fetchSemesters(data.uid);
        }
      } else {
        console.error("No profile document found for UID:", user.uid, "in collection:", collectionName);
        const scaffoldData = { uid: user.uid, email: user.email, createdAt: serverTimestamp() };
        await setDoc(userDocRef, scaffoldData, { merge: true });
        const newDocSnap = await getDoc(userDocRef);
        if(newDocSnap.exists()) {
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

  const fetchSemesters = async (studentId: string) => {
    try {
        const semestersQuery = query(collection(db, "students", studentId, "semesters"), orderBy("semester_no", "asc"));
        const querySnapshot = await getDocs(semestersQuery);
        const semesterData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Semester));
        setSemesters(semesterData);
    } catch (error) {
        console.error("Error fetching semesters: ", error);
        toast({ title: "Error", description: "Could not fetch semester data.", variant: "destructive" });
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
                    <CardDescription className="text-lg">{isTeacher ? (profileData as UserData).designation : (profileData as StudentData).degree}</CardDescription>
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
                    <InfoItem label="Degree" value={studentProfile.degree} />
                    <InfoItem label="Stream" value={studentProfile.stream} />
                    <InfoItem label="Batch" value={studentProfile.batch} />
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
