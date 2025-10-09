'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { EventFormValues } from "./event-form";
import { Roles } from "@/lib/roles";

interface CreateEventParams extends EventFormValues {
    postedBy: string;
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


export async function updateEvent(eventId: string, data: EventFormValues) {
    const eventRef = doc(db, "events", eventId);
    const updateData: DocumentData = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    // Don't overwrite authorship details
    delete updateData.postedBy;
    delete updateData.postedByName;
    delete updateData.authorRole;
    delete updateData.createdAt;

    await updateDoc(eventRef, updateData);
}

export async function deleteEvent(eventId: string) {
    await deleteDoc(doc(db, "events", eventId));
}
