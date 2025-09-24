"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Roles } from "@/lib/roles";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [reg_no, setRegNo] = useState('');
  const [degree, setDegree] = useState('');
  const [stream, setStream] = useState('');
  const [batch, setBatch] = useState('');
  const [start_year, setStartYear] = useState('');
  const [end_year, setEndYear] = useState('');
  
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create a profile.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create the /users document (source of truth for role)
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        role: 'student',
        createdAt: serverTimestamp(),
        status: "Active",
      }, { merge: true }); // Merge to avoid overwriting if doc already exists

      // Step 2: Create the /students document with full profile
      const studentDocRef = doc(db, "students", user.uid);
      await setDoc(studentDocRef, {
        uid: user.uid,
        name,
        email: user.email,
        phone,
        role: 'student',
        reg_no,
        degree,
        stream,
        batch_id: batch,
        start_year: parseInt(start_year, 10),
        end_year: parseInt(end_year, 10),
        status: "Active",
        createdBy: 'self', // or user.uid
        createdAt: serverTimestamp(),
        // student-editable fields
        linkedin,
        github,
        photoURL,
        bio,
      });

      toast({ title: "Success!", description: "Your profile has been created." });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error creating profile:", error);
      toast({ title: "Error", description: error.message || "Failed to create profile.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
      return (
         <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
            <p>Loading user information...</p>
        </div>
      )
  }

  // Redirect if user already has a role
  if (userRole) {
      router.replace('/dashboard');
      return (
           <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
            <p>Redirecting to your dashboard...</p>
        </div>
      )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
       <div className="flex flex-col items-center justify-center gap-4 text-center mb-8">
        <GraduationCap className="h-10 w-10 text-primary" />
        <h1 className="font-headline text-4xl font-bold text-primary">Welcome to MyStudentHub</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Complete Your Student Profile</CardTitle>
            <CardDescription>Please fill in your details to continue. Some fields may be pre-filled if provided by an admin.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email || ''} disabled />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe"/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 9876543210"/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="reg_no">Registration No.</Label>
                <Input id="reg_no" required value={reg_no} onChange={(e) => setRegNo(e.target.value)} placeholder="e.g., 24001"/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="degree">Degree</Label>
                <Input id="degree" required value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g., B.Tech"/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="stream">Stream</Label>
                <Input id="stream" required value={stream} onChange={(e) => setStream(e.target.value)} placeholder="e.g., Computer Science"/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="batch">Batch</Label>
                <Input id="batch" required value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g., 2024-2028"/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="start_year">Start Year</Label>
                <Input id="start_year" type="number" required value={start_year} onChange={(e) => setStartYear(e.target.value)} placeholder="e.g., 2024"/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="end_year">End Year</Label>
                <Input id="end_year" type="number" required value={end_year} onChange={(e) => setEndYear(e.target.value)} placeholder="e.g., 2028"/>
            </div>
             <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a bit about yourself"/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="photoURL">Photo URL</Label>
                <Input id="photoURL" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="Link to your profile picture"/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="URL of your profile"/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="github">GitHub Profile</Label>
                <Input id="github" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="URL of your profile"/>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save and Continue"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}
