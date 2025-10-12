import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, Code, Users, ShieldCheck, UserSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';


export default function AboutPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <header className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                    <GraduationCap className="h-12 w-12 text-primary" />
                    <h1 className="font-headline text-5xl font-bold">About MyStudentHub</h1>
                </div>
                <p className="text-xl text-muted-foreground">Your All-in-One Campus Companion</p>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-3">
                        <Code className="h-6 w-6 text-primary" />
                        What is MyStudentHub?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>
                        MyStudentHub is a modern, comprehensive web platform designed to streamline and enhance the academic and social lives of students, faculty, and administrators. It provides a centralized digital ecosystem for everything from attendance tracking to campus-wide event announcements.
                    </p>
                    <p>
                        This application was developed to solve the common problem of disconnected and scattered information on campus. By bringing everything into one accessible, user-friendly dashboard, MyStudentHub aims to foster a more connected, productive, and engaged academic community.
                    </p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-3">
                            <Users className="h-6 w-6 text-primary" />
                            Our Mission
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>
                            Our mission is to empower educational institutions with a robust digital tool that simplifies administrative tasks, enhances student-teacher communication, and builds a vibrant campus culture. We believe that by leveraging modern technology, we can create a more efficient and enriching educational experience for everyone involved.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            Key Principles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-muted-foreground">
                       <ul className="list-disc list-inside space-y-2">
                            <li><strong>User-Centric Design:</strong> Intuitive and accessible interfaces for all user roles.</li>
                            <li><strong>Real-time Communication:</strong> Instant updates via notices, events, and discussion circles.</li>
                            <li><strong>Data Security:</strong> Role-based access and secure data handling.</li>
                            <li><strong>Scalability:</strong> A robust architecture ready to grow with your institution.</li>
                       </ul>
                    </CardContent>
                </Card>
            </div>
            
            <Card className="text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-center gap-3">
                        <UserSquare className="h-6 w-6 text-primary" />
                        Meet The Developer
                    </CardTitle>
                    <CardDescription>This application was proudly built by <strong>Team Nanites</strong>.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button asChild>
                        <Link href="https://subhasish-nayak.onrender.com" target="_blank" rel="noopener noreferrer">
                           View Developer Portfolio
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}