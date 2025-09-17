import { assignments } from "@/lib/placeholder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download } from "lucide-react";

export function AssignmentTracker() {
    const getStatusVariant = (status: string): "destructive" | "secondary" | "default" | "outline" => {
        switch (status) {
            case 'Pending': return 'destructive';
            case 'Submitted': return 'secondary';
            case 'Graded': return 'default';
            default: return 'outline';
        }
    };
    
    return (
        <div className="space-y-6">
             <div>
                <h1 className="font-headline text-3xl font-bold">Assignment Tracker</h1>
                <p className="text-muted-foreground">Keep track of your assignments and due dates.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="font-headline">Your Assignments</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <Select defaultValue="computer-science">
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Degree" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="computer-science">Computer Science</SelectItem>
                                    <SelectItem value="business-admin">Business Administration</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select defaultValue="2">
                                <SelectTrigger className="w-full sm:w-[120px]">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Year 1</SelectItem>
                                    <SelectItem value="2">Year 2</SelectItem>
                                    <SelectItem value="3">Year 3</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button className="w-full sm:w-auto">
                                <Upload className="mr-2 h-4 w-4" /> Upload
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                    <TableCell className="font-medium">{assignment.subject}</TableCell>
                                    <TableCell>{assignment.title}</TableCell>
                                    <TableCell>{assignment.dueDate}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(assignment.status)}>{assignment.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">
                                            <Download className="mr-2 h-4 w-4" />
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
