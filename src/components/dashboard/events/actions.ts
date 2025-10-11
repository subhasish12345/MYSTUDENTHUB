"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, DocumentData } from "firebase/firestore";
import { revalidatePath } from "next/cache";

interface EventData extends DocumentData {
    title: string;
    description: string;
    date: Date;
    venue: string;
    category: string;
    status: 'Scheduled' | 'Cancelled';
    registrationLink?: string;
    imageUrl?: string;
    postedBy: string;
    postedByName: string;
    authorRole: string;
}

export async function createEvent(data: Omit<EventData, 'id' | 'createdAt' | 'updatedAt'>) {
    await addDoc(collection(db, "events"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/events");
}

export async function updateEvent(eventId: string, data: Partial<EventData>) {
    await updateDoc(doc(db, "events", eventId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/events");
}

export async function deleteEvent(eventId: string) {
    await deleteDoc(doc(db, "events", eventId));
    revalidatePath("/dashboard/events");
}
