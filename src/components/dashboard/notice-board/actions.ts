
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData } from "firebase/firestore";
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

    const noticeData: DocumentData = {
        title,
        description,
        postedBy,
        postedByName,
        authorRole, // This is now guaranteed to be passed from the client
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
