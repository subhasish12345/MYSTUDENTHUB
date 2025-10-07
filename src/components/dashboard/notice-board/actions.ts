
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, updateDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import { NoticeFormValues } from "./notice-form";
import { revalidatePath } from "next/cache";
import { Roles } from "@/lib/roles";

interface CreateNoticeParams extends NoticeFormValues {
    postedBy: string;
    postedByName: string;
    authorRole: Roles;
}

export async function createNotice(data: CreateNoticeParams) {
    const { title, description, imageUrl, targetType, degree, stream, batch, postedBy, postedByName, authorRole } = data;

    if (!authorRole) {
        throw new Error("Author role is missing and is required to create a notice.");
    }
    if (authorRole !== 'admin' && authorRole !== 'teacher') {
        throw new Error("You do not have permission to create a notice.");
    }

    const noticeData: DocumentData = {
        title,
        description,
        postedBy,
        postedByName,
        authorRole,
        createdAt: serverTimestamp(),
        target: {
            type: targetType,
        }
    };
    
    if (imageUrl) noticeData.imageUrl = imageUrl;

    if (targetType === 'degree' && degree) {
        noticeData.target.degree = degree;
    }
    if (targetType === 'stream' && degree && stream) {
        noticeData.target.degree = degree;
        noticeData.target.stream = stream;
    }
    if (targetType === 'batch' && degree && stream && batch) {
        noticeData.target.degree = degree;
        noticeData.target.stream = stream;
        noticeData.target.batch = batch;
    }

    await addDoc(collection(db, "notices"), noticeData);

    revalidatePath("/dashboard/notice-board");
}


export async function updateNotice(noticeId: string, data: NoticeFormValues) {
    const noticeRef = doc(db, "notices", noticeId);
    
    // It's crucial to not update fields that determine ownership or creation time.
    const updateData: DocumentData = {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || "", // Ensure it's not undefined
        target: {
            type: data.targetType,
            degree: data.degree || null,
            stream: data.stream || null,
            batch: data.batch || null,
        },
        updatedAt: serverTimestamp(),
    };

    await updateDoc(noticeRef, updateData);
    revalidatePath('/dashboard/notice-board');
}

export async function deleteNotice(noticeId: string) {
    await deleteDoc(doc(db, "notices", noticeId));
    revalidatePath("/dashboard/notice-board");
}
