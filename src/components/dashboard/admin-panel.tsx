import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherManagement } from "@/components/dashboard/admin/teacher-management";
import { StudentManagement } from "@/components/dashboard/admin/student-management";
import { DegreeManagement } from "@/components/dashboard/admin/degree-management";
import { StreamManagement } from "@/components/dashboard/admin/stream-management";
import { BatchManagement } from "@/components/dashboard/admin/batch-management";


export function AdminPanel() {
    return (
         <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage academic structure and user accounts.</p>
            </div>

            <Tabs defaultValue="teachers" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="degrees">Degrees</TabsTrigger>
                    <TabsTrigger value="streams">Streams</TabsTrigger>
                    <TabsTrigger value="batches">Batches</TabsTrigger>
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
            </Tabs>
        </div>
    );
}
