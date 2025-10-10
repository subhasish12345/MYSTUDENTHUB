"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, DocumentData } from "firebase/firestore";
import { revalidatePath } from "next/cache";

interface NoticeData extends DocumentData {
    title: string;
    content: string;
    category: string;
    authorId: string;
    authorName: string;
    authorRole: string;
}

export async function createNotice(data: NoticeData) {
    await addDoc(collection(db, "notices"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/notice-board");
}

export async function updateNotice(noticeId: string, data: Partial<NoticeData>) {
    await updateDoc(doc(db, "notices", noticeId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
    revalidatePath("/dashboard/notice-board");
}

export async function deleteNotice(noticeId: string) {
    await deleteDoc(doc(db, "notices", noticeId));
    revalidatePath("/dashboard/notice-board");
}
