"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyllabusViewer } from "./syllabus-viewer";
import { TimetableViewer } from "./timetable-viewer";
import { TimetableManager } from "./timetable-manager";
import { useAuth } from "@/hooks/use-auth";

export function SyllabusTimeTable() {
    const { userRole } = useAuth();
    const isAdmin = userRole === 'admin';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Syllabus & Timetable</h1>
                <p className="text-muted-foreground">View academic resources and schedules.</p>
            </div>

            <Tabs defaultValue="syllabus" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
                    <TabsTrigger value="timetable">Time Table</TabsTrigger>
                </TabsList>
                <TabsContent value="syllabus">
                    <SyllabusViewer />
                </TabsContent>
                <TabsContent value="timetable">
                    {isAdmin ? <TimetableManager /> : <TimetableViewer />}
                </TabsContent>
            </Tabs>
        </div>
    );
}
