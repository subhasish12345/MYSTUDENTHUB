
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

    // Fetch the user's name from either the 'teachers' or 'users' collection
    let postedByName = "Unknown";
    try {
        // Admins are in 'users', Teachers are in 'teachers'. This logic correctly fetches their name.
        const collectionName = userRole === 'teacher' ? 'teachers' : 'users';
        const userDocRef = doc(db, collectionName, postedBy);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            postedByName = userDoc.data().name || "Admin User";
        }
    } catch (e) {
        console.error("Could not fetch user's name for notice:", e);
    }


    const noticeData: DocumentData = {
        title,
        description,
        postedBy,
        postedByName,
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

