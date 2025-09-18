import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { TeacherManagement } from "@/components/dashboard/admin/teacher-management";

const dummyData = {
    degrees: [{id: 1, name: "B.Sc. Computer Science"}, {id: 2, name: "B.B.A."}, {id: 3, name: "B.A. Arts"}],
    streams: [{id: 1, name: "Software Engineering"}, {id: 2, name: "Data Science"}, {id: 3, name: "Marketing"}],
    years: [{id: 1, name: "First Year"}, {id: 2, name: "Second Year"}, {id: 3, name: "Third Year"}],
    batches: [{id: 1, name: "2024-2028"}, {id: 2, name: "2023-2027"}, {id: 3, name: "2022-2026"}],
};

const AdminTable = ({ data, title }: { data: {id: number, name: string}[], title: string }) => (
    <Card>
        <CardHeader className="flex flex-row justify-between items-center">
             <div>
                <CardTitle className="font-headline">{title}</CardTitle>
                <CardDescription>Manage all {title.toLowerCase()} in the system.</CardDescription>
            </div>
            <Button>
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
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">Delete</DropdownMenuItem>
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
                <p className="text-muted-foreground">Manage academic structure and settings.</p>
            </div>

            <Tabs defaultValue="teachers" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                    <TabsTrigger value="degrees">Degrees</TabsTrigger>
                    <TabsTrigger value="streams">Streams</TabsTrigger>
                    <TabsTrigger value="years">Years</TabsTrigger>
                    <TabsTrigger value="batches">Batches</TabsTrigger>
                </TabsList>
                <TabsContent value="teachers">
                    <TeacherManagement />
                </TabsContent>
                <TabsContent value="degrees">
                    <AdminTable data={dummyData.degrees} title="Degrees" />
                </TabsContent>
                <TabsContent value="streams">
                    <AdminTable data={dummyData.streams} title="Streams" />
                </TabsContent>
                <TabsContent value="years">
                     <AdminTable data={dummyData.years} title="Years" />
                </TabsContent>
                 <TabsContent value="batches">
                    <AdminTable data={dummyData.batches} title="Batches" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
