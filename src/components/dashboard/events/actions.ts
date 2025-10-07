
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

export async function updateEvent(eventId: string, data: UpdateEventParams) {

    const eventRef = doc(db, "events", eventId);
    
    const updateData: DocumentData = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    await updateDoc(eventRef, updateData);
}

export async function deleteEvent(eventId: string) {
    // The security rule for delete now checks the role of the user making the request.
    await deleteDoc(doc(db, "events", eventId));
}
