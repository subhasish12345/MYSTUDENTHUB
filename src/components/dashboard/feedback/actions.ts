"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export interface FeedbackData extends DocumentData {
    feedbackType: 'Faculty' | 'Event';
    subjectId: string;
    subjectName: string;
    rating: number;
    comment: string;
    isAnonymous: boolean;
    submittedBy: string; // The user's UID
    studentName: string; // The user's actual name
    createdAt: any;
}

export async function submitFeedback(data: Omit<FeedbackData, 'createdAt'>) {
    await addDoc(collection(db, "feedback"), {
        ...data,
        createdAt: serverTimestamp(),
    });
    // Revalidate admin path to show new feedback
    revalidatePath("/dashboard/admin");
}
