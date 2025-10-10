"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, DocumentData } from "firebase/firestore";
import { revalidatePath } from "next/cache";

interface MaterialData extends DocumentData {
    title: string;
    description?: string;
    url: string;
    degreeId: string;
    streamId: string;
    semester: number;
    subject: string;
    authorId: string;
    authorName: string;
}

export async function createMaterial(data: Omit<MaterialData, 'createdAt'>) {
    await addDoc(collection(db, "studyMaterials"), {
        ...data,
        createdAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/materials");
}

export async function updateMaterial(materialId: string, data: Partial<MaterialData>) {
    await updateDoc(doc(db, "studyMaterials", materialId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/materials");
}

export async function deleteMaterial(materialId: string) {
    await deleteDoc(doc(db, "studyMaterials", materialId));
    revalidatePath("/dashboard/materials");
}
