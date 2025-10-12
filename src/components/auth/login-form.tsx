"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, AuthError, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { LogIn, Chrome } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { Separator } from "../ui/separator";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error("Login failed:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error instanceof Error && 'code' in error) {
        const authError = error as AuthError;
        if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        }
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document already exists
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // If it's a new user, create their document in /users
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: 'student', // Default new sign-ups to student
          createdAt: serverTimestamp(),
          status: "Active",
        });
        // Redirect new users to profile setup
        router.push("/profile-setup");
      } else {
        // Existing user, go to dashboard
        router.push("/dashboard");
      }
      
    } catch (error: any) {
        console.error("Google login failed:", error);
        toast({
            title: "Google Login Failed",
            description: error.message || "Could not sign in with Google. Please try again.",
            variant: "destructive",
        });
    } finally {
        setGoogleLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-sm mt-8 shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleEmailLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing In..." : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>}
            </Button>
          </CardFooter>
        </form>
         <div className="relative mb-4">
          <Separator />
          <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            OR
          </p>
        </div>
        <div className="px-6 pb-6">
            <Button className="w-full" variant="outline" onClick={handleGoogleLogin} disabled={googleLoading}>
                {googleLoading ? "Signing In..." : <><Chrome className="mr-2 h-4 w-4" /> Sign In with Google</>}
            </Button>
        </div>
      </Card>
  );
}
