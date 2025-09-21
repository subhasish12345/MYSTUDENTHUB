
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc, serverTimestamp, updateDoc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PenSquare, Mail, Phone, Building, GraduationCap, Briefcase, Linkedin, Github } from "lucide-react";
import { UserData } from "@/components/dashboard/admin/teacher-management";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { EditProfileForm, ProfileFormValues } from "@/components/dashboard/profile/edit-profile-form";
import { useToast } from "@/hooks/use-toast";

type ProfileData = DocumentData & { id: string };

export default function ProfilePage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
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

    // Determine which collection to query based on role
    const collectionName = userRole === 'teacher' ? 'teachers' : 'students';
    const userDocRef = doc(db, collectionName, user.uid);
    
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setProfileData({ id: docSnap.id, ...docSnap.data() } as ProfileData);
      } else {
        console.error("No profile document found for UID:", user.uid, "in collection:", collectionName);
        setProfileData(null);
      }
    } catch (error) {
       console.error("Error fetching user data:", error);
       setProfileData(null);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userRole && isClient) {
      fetchUserData();
    } else if (isClient) {
      setLoading(false);
    }
  }, [user, userRole, isClient]);

  const handleProfileUpdate = async (values: ProfileFormValues) => {
    if (!user || !userRole) {
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
        const collectionName = userRole === 'teacher' ? 'teachers' : 'students';
        const userDocRef = doc(db, collectionName, user.uid);
        
        await updateDoc(userDocRef, {
            ...values,
            updatedAt: serverTimestamp(),
        });
        
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


  if (!isClient || loading) {
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

  return (
    <>
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={profileData.photoURL} alt={profileData.name} data-ai-hint="person face" />
            <AvatarFallback className="text-3xl">{profileData.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                 <div>
                    <CardTitle className="font-headline text-3xl">{profileData.name}</CardTitle>
                    <CardDescription className="text-lg">{isTeacher ? profileData.designation : profileData.degree}</CardDescription>
                </div>
                 <Button className="mt-4 sm:mt-0" onClick={() => setIsSheetOpen(true)}>
                    <PenSquare className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
            </div>
            <div className="flex items-center gap-4 mt-4 text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {profileData.email}</div>
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
                    <InfoItem label="Department" value={profileData.department} />
                    <InfoItem label="Qualification" value={profileData.qualification} />
                    <InfoItem label="Specialization" value={profileData.specialization} />
                    <InfoItem label="Experience" value={`${profileData.experienceYears} years`} />
                    <InfoItem label="Employee ID" value={profileData.employeeId} />
                     <InfoItem label="Status">
                        <Badge variant={profileData.status === 'Active' ? 'default' : 'secondary'}>{profileData.status}</Badge>
                    </InfoItem>
                    <div className="md:col-span-2">
                         <InfoItem label="Subjects" value={profileData.subjects?.join(', ')} />
                    </div>
                </>}
                 {isStudent && <>
                    <InfoItem label="Registration No." value={profileData.reg_no} />
                    <InfoItem label="Degree" value={profileData.degree} />
                    <InfoItem label="Stream" value={profileData.stream} />
                    <InfoItem label="Batch" value={profileData.batch} />
                    <InfoItem label="Start Year" value={profileData.start_year} />
                    <InfoItem label="End Year" value={profileData.end_year} />
                </>}
            </CardContent>
        </Card>
        
        <Card className="shadow-lg">
             <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Building/> University Info</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4 text-sm">
                <InfoItem label="Campus" value={profileData.campus} />
                <InfoItem label="Building" value={profileData.building} />
                <InfoItem label="Room No." value={profileData.roomNo} />
                <InfoItem label="University ID" value={profileData.universityId} />
                <div className="border-t pt-4 mt-4 space-y-2">
                    {profileData.linkedin && 
                        <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                            <Linkedin className="h-4 w-4" /> LinkedIn Profile
                        </a>
                    }
                    {profileData.github && 
                         <a href={profileData.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                            <Github className="h-4 w-4" /> GitHub Profile
                        </a>
                    }
                </div>
            </CardContent>
        </Card>
      </div>

       {profileData.bio && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline">Bio</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{profileData.bio}</p>
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
    if (!value && !children) return null;
    return (
        <div className="grid grid-cols-2 items-center">
            <p className="font-semibold text-muted-foreground">{label}</p>
            {value ? <p>{value}</p> : children}
        </div>
    )
}
