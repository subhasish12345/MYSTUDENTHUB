"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, DocumentData, orderBy } from "firebase/firestore";
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
                // Find all groups the student is a member of
                 groupsQuery = query(collection(db, "semesterGroups"), where("students", "array-contains", user.uid));
            }
            
            if (groupsQuery) {
                const groupsSnap = await getDocs(groupsQuery);
                const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SemesterGroup));
                setAccessibleGroups(groups);
                if (groups.length > 0) {
                    // Sort by semester number descending to select the latest one
                    const sortedGroups = groups.sort((a,b) => (b.semester_no || 0) - (a.semester_no || 0));
                    setSelectedGroup(sortedGroups[0]);
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
