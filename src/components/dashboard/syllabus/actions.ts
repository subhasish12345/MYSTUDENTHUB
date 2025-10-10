"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, DocumentData, setDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// --- Syllabus Actions ---
export interface SyllabusData extends DocumentData {
    title: string;
    url: string;
    degreeId: string;
    streamId: string;
    semester: number;
    subject: string;
    authorId: string;
    authorName: string;
}

export async function createSyllabus(data: Omit<SyllabusData, 'createdAt' | 'id'>) {
    await addDoc(collection(db, "syllabi"), {
        ...data,
        createdAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/syllabus");
}

export async function updateSyllabus(syllabusId: string, data: Partial<SyllabusData>) {
    await updateDoc(doc(db, "syllabi", syllabusId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/syllabus");
}

export async function deleteSyllabus(syllabusId: string) {
    await deleteDoc(doc(db, "syllabi", syllabusId));
    revalidatePath("/dashboard/syllabus");
}

// --- Timetable Actions ---
export interface TimetableData extends DocumentData {
    groupId: string;
    monday: Period[];
    tuesday: Period[];
    wednesday: Period[];
    thursday: Period[];
    friday: Period[];
    saturday?: Period[];
}

export interface Period {
    time: string;
    subject: string;
}

export async function saveTimetable(data: TimetableData) {
    // The document ID will be the same as the groupId for easy lookup
    await setDoc(doc(db, "timetables", data.groupId), {
        ...data,
        updatedAt: serverTimestamp(),
    }, { merge: true });
    revalidatePath("/dashboard/syllabus");
}
