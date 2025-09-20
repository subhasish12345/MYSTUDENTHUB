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
  const { user } = useAuth();
  const { toast } = useToast();

  // Student specific fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [degree, setDegree] = useState('');
  const [stream, setStream] = useState('');
  const [joiningYear, setJoiningYear] = useState('');
  const [passingYear, setPassingYear] = useState('');
  const [isHosteler, setIsHosteler] = useState('');
  const [gender, setGender] = useState('');
  const [marks10th, setMarks10th] = useState('');
  const [marks12th, setMarks12th] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create a profile.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name,
        phone,
        role: 'student', // All users completing this form are students
        degree,
        stream,
        joiningYear,
        passingYear,
        isHosteler: isHosteler === 'true',
        gender,
        marks10th,
        marks12th,
        linkedin,
        github,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
            <CardDescription>Please fill in your academic details to continue.</CardDescription>
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
                <Label htmlFor="degree">Degree</Label>
                <Input id="degree" required value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g., B.Sc. Computer Science"/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="stream">Stream</Label>
                <Input id="stream" required value={stream} onChange={(e) => setStream(e.target.value)} placeholder="e.g., Software Engineering"/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="joiningYear">Joining Year</Label>
                <Input id="joiningYear" type="number" required value={joiningYear} onChange={(e) => setJoiningYear(e.target.value)} placeholder="e.g., 2023"/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="passingYear">Passing Year</Label>
                <Input id="passingYear" type="number" required value={passingYear} onChange={(e) => setPassingYear(e.target.value)} placeholder="e.g., 2027"/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                 <Select required onValueChange={(value) => setGender(value)} value={gender}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                         <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="isHosteler">Are you a Hosteler?</Label>
                 <Select required onValueChange={(value) => setIsHosteler(value)} value={isHosteler}>
                    <SelectTrigger id="isHosteler"><SelectValue placeholder="Select one" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No, Day Scholar</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="marks10th">10th Marks (%)</Label>
                <Input id="marks10th" type="number" required value={marks10th} onChange={(e) => setMarks10th(e.target.value)} placeholder="e.g., 85.5"/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="marks12th">12th Marks (%)</Label>
                <Input id="marks12th" type="number" required value={marks12th} onChange={(e) => setMarks12th(e.target.value)} placeholder="e.g., 92.0"/>
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
