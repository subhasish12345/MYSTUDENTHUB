"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { EventFormValues } from "./event-form";
import { Roles } from "@/lib/roles";

interface CreateEventParams extends EventFormValues {
    createdBy: string;
    postedByName: string;
    authorRole: Roles;
}

// The 'authorRole' is now required and will be checked by security rules.
export async function createEvent(data: CreateEventParams) {
    const eventData: DocumentData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    await addDoc(collection(db, "events"), eventData);
}

interface UpdateEventParams extends EventFormValues {
    authorRole: Roles;
}

// The 'authorRole' is passed with the update to be checked by security rules.
export async function updateEvent(eventId: string, data: UpdateEventParams) {
    const eventRef = doc(db, "events", eventId);
    const updateData: DocumentData = {
        ...data,
        updatedAt: serverTimestamp(),
    };
    await updateDoc(eventRef, updateData);
}

export async function deleteEvent(eventId: string) {
    await deleteDoc(doc(db, "events", eventId));
}
