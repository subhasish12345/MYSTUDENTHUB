"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { EventFormValues } from "./event-form";
import { Roles } from "@/lib/roles";

interface CreateEventParams extends EventFormValues {
    createdBy: string;
    authorRole: Roles;
}

export async function createEvent(data: CreateEventParams) {
    
    const eventData: DocumentData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    if (eventData.authorRole !== 'admin') {
        throw new Error("Only admins can create events.");
    }

    await addDoc(collection(db, "events"), eventData);

    revalidatePath("/dashboard/events");
}


export async function updateEvent(eventId: string, data: EventFormValues) {
    const eventRef = doc(db, "events", eventId);
    
    const updateData: DocumentData = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    await updateDoc(eventRef, updateData);
    revalidatePath('/dashboard/events');
}

export async function deleteEvent(eventId: string) {
    await deleteDoc(doc(db, "events", eventId));
    revalidatePath("/dashboard/events");
}
