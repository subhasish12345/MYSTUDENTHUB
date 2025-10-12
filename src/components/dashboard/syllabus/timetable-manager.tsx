
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimetableForm } from "./timetable-form";
import { TimetableViewer } from "./timetable-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface SemesterGroup extends DocumentData {
    id: string;
    groupId: string;
}

export function TimetableManager() {
    const { toast } = useToast();
    const [allGroups, setAllGroups] = useState<SemesterGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<SemesterGroup | null>(null);
    const [loadingGroups, setLoadingGroups] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "semesterGroups"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SemesterGroup));
            setAllGroups(groupsData.sort((a,b) => a.groupId.localeCompare(b.groupId)));
            setLoadingGroups(false);
        }, (error) => {
            console.error("Error fetching groups: ", error);
            toast({ title: "Error", description: "Could not fetch semester groups.", variant: "destructive"});
            setLoadingGroups(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const handleGroupSelect = (groupId: string) => {
        const group = allGroups.find(g => g.id === groupId);
        setSelectedGroup(group || null);
    };

    return (
        <div className="space-y-6 pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Timetables</CardTitle>
                    <CardDescription>Select a group to create or edit its weekly timetable.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={handleGroupSelect} disabled={loadingGroups}>
                        <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select a group..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {allGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.groupId.replace(/_/g, ' ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedGroup && (
                <Tabs defaultValue="edit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="edit">Edit Timetable</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit">
                        <TimetableForm group={selectedGroup} />
                    </TabsContent>
                    <TabsContent value="preview">
                        <div className="overflow-x-auto">
                            <TimetableViewer specificGroup={selectedGroup} />
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
