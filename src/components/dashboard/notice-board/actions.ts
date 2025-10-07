
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, DocumentData, updateDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import { NoticeFormValues } from "./notice-form";
import { Roles } from "@/lib/roles";

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

    if (data.targetType === 'degree' && data.degree) {
        noticeData.target = { type: 'degree', degree: data.degree };
    } else if (data.targetType === 'stream' && data.degree && data.stream) {
        noticeData.target = { type: 'stream', degree: data.degree, stream: data.stream };
    } else if (data.targetType === 'batch' && data.degree && data.stream && data.batch) {
        noticeData.target = { type: 'batch', degree: data.degree, stream: data.stream, batch: data.batch };
    } else {
        noticeData.target = { type: 'global' };
    }

    await addDoc(collection(db, "notices"), noticeData);
}

interface UpdateNoticeParams extends NoticeFormValues {
    authorRole: Roles;
}

export async function updateNotice(noticeId: string, data: UpdateNoticeParams) {
    const noticeRef = doc(db, "notices", noticeId);
    
    const updateData: DocumentData = {
        ...data,
        updatedAt: serverTimestamp(),
    };
    
    if (data.targetType === 'degree' && data.degree) {
        updateData.target = { type: 'degree', degree: data.degree };
    } else if (data.targetType === 'stream' && data.degree && data.stream) {
        updateData.target = { type: 'stream', degree: data.degree, stream: data.stream };
    } else if (data.targetType === 'batch' && data.degree && data.stream && data.batch) {
        updateData.target = { type: 'batch', degree: data.degree, stream: data.stream, batch: data.batch };
    } else {
        updateData.target = { type: 'global' };
    }

    await updateDoc(noticeRef, updateData);
}

export async function deleteNotice(noticeId: string) {
    await deleteDoc(doc(db, "notices", noticeId));
}
