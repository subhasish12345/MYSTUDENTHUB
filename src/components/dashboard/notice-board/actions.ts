
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, doc, getDoc } from "firebase/firestore";
import { NoticeFormValues } from "./notice-form";
import { revalidatePath } from "next/cache";
import { Roles } from "@/lib/roles";

interface CreateNoticeParams extends NoticeFormValues {
    postedBy: string;
    userRole: Roles;
}

export async function createNotice(data: CreateNoticeParams) {
    const { title, description, imageUrl, targetType, degree, stream, batch, postedBy, userRole } = data;

    // This preliminary check was causing permission issues. 
    // The name can be added differently if needed, but for creation, we only need the UID.
    // Let's assume postedByName will be handled on the client or is not critical for creation.
    const postedByName = "User"; // Placeholder

    const noticeData: DocumentData = {
        title,
        description,
        postedBy,
        postedByName, // This can be improved later, but removes the blocking read call
        createdAt: serverTimestamp(),
        target: {
            type: targetType,
        }
    };
    
    if (imageUrl) noticeData.imageUrl = imageUrl;

    if (targetType === 'degree' && degree) noticeData.target.degree = degree;
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
