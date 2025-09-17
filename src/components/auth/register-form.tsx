"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function RegisterForm() {
    const router = useRouter();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder for Firebase registration logic
        router.push('/dashboard');
    };
    
  return (
    <form onSubmit={handleRegister}>
        <Card className="w-full max-w-sm mt-8 shadow-2xl">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Register</CardTitle>
            <CardDescription>Create your new student account in a few clicks.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" placeholder="John Doe" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" required />
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit">
                <UserPlus className="mr-2 h-4 w-4" /> Create Account
            </Button>
            <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/" className="font-semibold text-primary hover:underline">
                    Login
                </Link>
            </p>
        </CardFooter>
        </Card>
    </form>
  );
}
