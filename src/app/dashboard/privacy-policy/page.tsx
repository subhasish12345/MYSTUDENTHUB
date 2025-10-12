import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                    <FileText className="h-12 w-12 text-primary" />
                    <h1 className="font-headline text-5xl font-bold">Privacy Policy</h1>
                </div>
                <p className="text-lg text-muted-foreground">Last updated: October 12, 2025</p>
            </header>

            <Card>
                <CardContent className="p-6 md:p-8 space-y-6 text-muted-foreground">
                    <section className="space-y-2">
                        <h2 className="font-headline text-2xl font-semibold text-foreground">1. Introduction</h2>
                        <p>
                            Welcome to MyStudentHub. We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy policy sets out how we collect, use, and protect any information that you give us when you use this application.
                        </p>
                    </section>

                     <section className="space-y-2">
                        <h2 className="font-headline text-2xl font-semibold text-foreground">2. Information We Collect</h2>
                        <p>We may collect the following information:</p>
                        <ul className="list-disc list-inside space-y-1 pl-4">
                            <li><strong>Personal Identification Information:</strong> Name, email address, phone number, registration number.</li>
                            <li><strong>Academic Information:</strong> Degree, stream, batch, semester details, attendance, and grades.</li>
                            <li><strong>User-Generated Content:</strong> Posts in Student Circles, feedback submissions, and items reported in Lost & Found.</li>
                            <li><strong>Technical Data:</strong> Firebase Cloud Messaging (FCM) tokens for push notifications, with your explicit consent.</li>
                        </ul>
                    </section>

                     <section className="space-y-2">
                        <h2 className="font-headline text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
                        <p>
                            We use the information we collect to operate and maintain the MyStudentHub platform and to provide you with its features, including:
                        </p>
                         <ul className="list-disc list-inside space-y-1 pl-4">
                            <li>To personalize your experience based on your role (Admin, Teacher, or Student).</li>
                            <li>To manage academic records, including attendance and grades.</li>
                            <li>To facilitate communication through notices, events, and discussion groups.</li>
                            <li>To send important academic and event-related notifications.</li>
                            <li>To improve our services based on the feedback you provide.</li>
                        </ul>
                    </section>

                     <section className="space-y-2">
                        <h2 className="font-headline text-2xl font-semibold text-foreground">4. Security</h2>
                        <p>
                            We are committed to ensuring that your information is secure. We use Firebase Authentication and Firestore Security Rules to prevent unauthorized access or disclosure. Access to data is strictly limited based on user roles.
                        </p>
                    </section>
                    
                     <section className="space-y-2">
                        <h2 className="font-headline text-2xl font-semibold text-foreground">5. Data Sharing</h2>
                        <p>
                            We do not sell, distribute, or lease your personal information to third parties unless we have your permission or are required by law to do so. Your data is only used within the context of the MyStudentHub application to provide its services.
                        </p>
                    </section>
                    
                     <section className="space-y-2">
                        <h2 className="font-headline text-2xl font-semibold text-foreground">6. Your Rights</h2>
                        <p>
                           You have the right to access and update your personal information through your user profile page. For any data deletion requests, please contact your institution's administrator.
                        </p>
                    </section>
                    
                    <section className="space-y-2">
                        <h2 className="font-headline text-2xl font-semibold text-foreground">7. Changes to This Policy</h2>
                        <p>
                            We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page. You are advised to review this Privacy Policy periodically for any changes.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
