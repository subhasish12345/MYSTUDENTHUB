"use client";

import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { IdCard } from "@/components/dashboard/id-card/id-card";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function IdCardPage() {
    const { user, userRole, userData, loading: authLoading } = useAuth();
    const [fullProfile, setFullProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFullProfile = async () => {
            if (authLoading || !user || !userData) return;

            setLoading(true);
            try {
                if (userRole === 'student') {
                    const degreeSnap = await getDoc(doc(db, 'degrees', userData.degree));
                    const streamSnap = await getDoc(doc(db, 'streams', userData.stream));
                    const batchSnap = await getDoc(doc(db, 'batches', userData.batch_id));
                    
                    setFullProfile({
                        ...userData,
                        degree_name: degreeSnap.exists() ? degreeSnap.data().name : 'N/A',
                        stream_name: streamSnap.exists() ? streamSnap.data().name : 'N/A',
                        batch_name: batchSnap.exists() ? batchSnap.data().batch_name : 'N/A',
                    });

                } else {
                    setFullProfile(userData);
                }
            } catch (error) {
                console.error("Failed to fetch full profile details", error);
                setFullProfile(userData); // Fallback to partial data
            } finally {
                setLoading(false);
            }
        };
        
        if (!authLoading) {
            fetchFullProfile();
        }

    }, [user, userRole, userData, authLoading]);

    const getCardColor = () => {
        if (userRole === 'teacher') return 'red';
        if (userRole === 'student') {
            return 'blue'; 
        }
        return 'blue';
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center p-4 sm:p-8">
                <Skeleton className="w-full max-w-[320px] h-[500px] rounded-md" />
            </div>
        )
    }

    if (!fullProfile) {
        return <p>Could not load profile data.</p>;
    }

    return (
        <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-[320px]">
                <IdCard profileData={fullProfile} color={getCardColor()} />
            </div>
        </main>
    );
}