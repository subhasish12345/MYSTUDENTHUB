'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, updateDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import { NoticeFormValues } from "./notice-form";
import { Roles } from "@/lib/roles";
import { revalidatePath } from "next/cache";

interface CreateNoticeParams extends NoticeFormValues {
    postedBy: string;
    postedByName: string;
    authorRole: Roles;
}

export async function createNotice(data: CreateNoticeParams) {
    const noticeData: DocumentData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, "notices"), noticeData);
}

export async function updateNotice(noticeId: string, data: NoticeFormValues) {
    const noticeRef = doc(db, "notices", noticeId);
    
    // Ensure critical authorship fields are not overwritten from the client form
    const updateData: DocumentData = {
        ...data,
        updatedAt: serverTimestamp(),
    };
    
    delete updateData.postedBy;
    delete updateData.postedByName;
    delete updateData.authorRole;
    delete updateData.createdAt;

    await updateDoc(noticeRef, updateData);
}

export async function deleteNotice(noticeId: string) {
    await deleteDoc(doc(db, "notices", noticeId));
}
