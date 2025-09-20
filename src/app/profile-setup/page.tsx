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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Roles | ''>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create a profile.", variant: "destructive" });
      return;
    }
     if (!role) {
      toast({ title: "Error", description: "Please select your role.", variant: "destructive" });
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
        role,
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
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>Please fill in your details to continue.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
                <Label htmlFor="role">I am a...</Label>
                 <Select required onValueChange={(value: Roles) => setRole(value)} value={role}>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                </Select>
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
