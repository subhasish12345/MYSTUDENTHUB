import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherManagement } from "@/components/dashboard/admin/teacher-management";
import { StudentManagement } from "@/components/dashboard/admin/student-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const dummyData = {
    degrees: [{id: 1, name: "B.Sc. Computer Science"}, {id: 2, name: "B.B.A."}, {id: 3, name: "B.A. Arts"}],
    streams: [{id: 1, name: "Software Engineering"}, {id: 2, name: "Data Science"}, {id: 3, name: "Marketing"}],
};

const AdminTable = ({ data, title }: { data: {id: number, name: string}[], title: string }) => (
    <Card>
        <CardHeader className="flex flex-row justify-between items-center">
             <div>
                <CardTitle className="font-headline">{title}</CardTitle>
                <CardDescription>Manage all {title.toLowerCase()} in the system. (Coming Soon)</CardDescription>
            </div>
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New
            </Button>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                        <DropdownMenuItem disabled className="text-destructive focus:text-destructive-foreground focus:bg-destructive">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

export function AdminPanel() {
    return (
         <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage academic structure and user accounts.</p>
            </div>

            <Tabs defaultValue="teachers" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="degrees">Degrees</TabsTrigger>
                    <TabsTrigger value="streams">Streams</TabsTrigger>
                </TabsList>
                <TabsContent value="teachers">
                    <TeacherManagement />
                </TabsContent>
                <TabsContent value="students">
                    <StudentManagement />
                </TabsContent>
                <TabsContent value="degrees">
                    <AdminTable data={dummyData.degrees} title="Degrees" />
                </TabsContent>
                <TabsContent value="streams">
                    <AdminTable data={dummyData.streams} title="Streams" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
