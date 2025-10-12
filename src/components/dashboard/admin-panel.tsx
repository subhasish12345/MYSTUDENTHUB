import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherManagement } from "@/components/dashboard/admin/teacher-management";
import { StudentManagement } from "@/components/dashboard/admin/student-management";
import { DegreeManagement } from "@/components/dashboard/admin/degree-management";
import { StreamManagement } from "@/components/dashboard/admin/stream-management";
import { BatchManagement } from "@/components/dashboard/admin/batch-management";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FirestoreRules } from "@/components/dashboard/admin/firestore-rules";
import { FeedbackViewer } from "./feedback/feedback-viewer";
import { ReportGeneration } from "./admin/report-generation";


export function AdminPanel() {
    return (
         <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage academic structure and user accounts.</p>
            </div>

            <Tabs defaultValue="teachers" className="w-full">
                <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="degrees">Degrees</TabsTrigger>
                    <TabsTrigger value="streams">Streams</TabsTrigger>
                    <TabsTrigger value="batches">Batches</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                </TabsList>
                <TabsContent value="teachers">
                    <TeacherManagement />
                </TabsContent>
                <TabsContent value="students">
                    <StudentManagement />
                </TabsContent>
                <TabsContent value="degrees">
                    <DegreeManagement />
                </TabsContent>
                <TabsContent value="streams">
                    <StreamManagement />
                </TabsContent>
                <TabsContent value="batches">
                    <BatchManagement />
                </TabsContent>
                <TabsContent value="feedback">
                    <FeedbackViewer />
                </TabsContent>
                 <TabsContent value="reports">
                    <ReportGeneration />
                </TabsContent>
                 <TabsContent value="rules">
                    <Card>
                        <CardHeader>
                            <CardTitle>Firestore Security Rules</CardTitle>
                            <CardDescription>
                                For the application to work correctly, your Firestore database must have the following security rules. Please copy and paste these into the Rules tab in your Firebase Console.
                            </CardDescription>
                        </CardHeader>
                        <FirestoreRules />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
