
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, getDoc, doc } from "firebase/firestore";
import { NoticeFormValues } from "./notice-form";
import { revalidatePath } from "next/cache";

interface CreateNoticeParams extends NoticeFormValues {
    postedBy: string;
}

export async function createNotice(data: CreateNoticeParams) {
    const { title, description, imageUrl, targetType, degree, stream, batch, postedBy } = data;

    let postedByName = "User"; // Default fallback name

    try {
        // Safely fetch the user's name from the /users collection
        const userDocRef = doc(db, "users", postedBy);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            // Only access .name if the document data exists
            const userData = userDoc.data();
            postedByName = userData.name || "User"; // Use name if available, otherwise fallback
        }
    } catch (error) {
        console.error("Could not fetch user name for notice:", error);
        // If fetching fails, we can still proceed with a default name
    }


    const noticeData: DocumentData = {
        title,
        description,
        postedBy,
        postedByName: postedByName,
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
