
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { EventFormValues } from "./event-form";
import { Roles } from "@/lib/roles";

interface CreateEventParams extends EventFormValues {
    createdBy: string;
    postedByName: string; // Add this
    authorRole: Roles;
}

export async function createEvent(data: CreateEventParams) {
    
    if (data.authorRole !== 'admin') {
        throw new Error("Only admins can create events.");
    }

    const eventData: DocumentData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, "events"), eventData);

    revalidatePath("/dashboard/events");
}

interface UpdateEventParams extends EventFormValues {
    authorRole: Roles;
}

export async function updateEvent(eventId: string, data: UpdateEventParams) {
    if (data.authorRole !== 'admin') {
        throw new Error("Only admins can update events.");
    }

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
