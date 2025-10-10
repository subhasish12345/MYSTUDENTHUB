"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupSelector } from "@/components/dashboard/circles/group-selector";
import { ChatPanel } from "@/components/dashboard/circles/chat-panel";

export interface SemesterGroup extends DocumentData {
    id: string;
    groupId: string;
}

export default function CirclesPage() {
    const { user, userRole, userData, loading: authLoading } = useAuth();
    const [accessibleGroups, setAccessibleGroups] = useState<SemesterGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<SemesterGroup | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAccessibleGroups = useCallback(async () => {
        if (!user || !userRole) return;
        setLoading(true);

        try {
            let groupsQuery;
            if (userRole === 'admin') {
                groupsQuery = query(collection(db, "semesterGroups"));
            } else if (userRole === 'teacher' && userData?.assignedGroups?.length > 0) {
                groupsQuery = query(collection(db, "semesterGroups"), where("groupId", "in", userData.assignedGroups));
            } else if (userRole === 'student') {
                // Find the student's current semester group
                const studentDoc = await getDoc(doc(db, "students", user.uid));
                if (studentDoc.exists()) {
                    const studentData = studentDoc.data();
                    const semestersSnap = await getDocs(query(collection(db, `students/${user.uid}/semesters`)));
                    if (!semestersSnap.empty) {
                        // This logic assumes the student has one primary group.
                        // A more complex app might need to let the student choose.
                         const latestSem = semestersSnap.docs.sort((a,b) => b.data().semester_no - a.data().semester_no)[0].data();
                         const degreeDoc = await getDoc(doc(db, 'degrees', studentData.degree));
                         const streamDoc = await getDoc(doc(db, 'streams', studentData.stream));
                         const batchDoc = await getDoc(doc(db, 'batches', studentData.batch_id));
                        
                        if(degreeDoc.exists() && streamDoc.exists() && batchDoc.exists()) {
                            const groupId = `${degreeDoc.data().name}_${streamDoc.data().name}_${batchDoc.data().batch_name}_sem${latestSem.semester_no}_${latestSem.section}`.replace(/\s+/g, '_');
                            groupsQuery = query(collection(db, "semesterGroups"), where("groupId", "==", groupId));
                        }
                    }
                }
            }
            
            if (groupsQuery) {
                const groupsSnap = await getDocs(groupsQuery);
                const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SemesterGroup));
                setAccessibleGroups(groups);
                if (groups.length > 0) {
                    setSelectedGroup(groups[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching accessible groups:", error);
        } finally {
            setLoading(false);
        }
    }, [user, userRole, userData]);

    useEffect(() => {
        if (!authLoading) {
            fetchAccessibleGroups();
        }
    }, [authLoading, fetchAccessibleGroups]);

    if (authLoading || loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Student Circles</h1>
                <p className="text-muted-foreground">Connect and collaborate with your peers in private groups.</p>
            </div>
            
            {accessibleGroups.length > 0 ? (
                <>
                    <GroupSelector 
                        groups={accessibleGroups}
                        selectedGroup={selectedGroup}
                        onSelectGroup={setSelectedGroup}
                        userRole={userRole}
                    />
                    {selectedGroup && <ChatPanel group={selectedGroup} />}
                </>
            ) : (
                 <div className="text-center py-16 border-dashed border-2 rounded-lg">
                    <h3 className="font-headline text-2xl font-semibold">No Groups Found</h3>
                    <p className="text-muted-foreground">
                        {userRole === 'student'
                            ? "You are not yet part of any discussion group."
                            : "You have not been assigned to any groups."
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
