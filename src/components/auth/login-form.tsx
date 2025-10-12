"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
  
  return (
      <form onSubmit={handleEmailLogin} className="form-container w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
        <p>
          Welcome,
          <span>sign in to continue</span>
        </p>
        
        <input 
          id="email" 
          type="email" 
          placeholder="Email" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />
        
        <input 
          id="password" 
          type="password"
          placeholder="Password"
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />

        <button className="form-button" type="submit" disabled={loading}>
          {loading ? "Signing In..." : (
            <>
              <LogIn />
              Sign In
            </>
          )}
        </button>
      </form>
  );
}
